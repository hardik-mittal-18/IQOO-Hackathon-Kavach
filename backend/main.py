from datetime import datetime, timezone
import asyncio
import base64
import json
import logging
import os
import re
from pathlib import Path
from typing import List
from urllib.parse import parse_qs, urlparse

from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from twilio.base.exceptions import TwilioRestException
from twilio.rest import Client
from scam_analysis import analyze_transcript


backend_dir = Path(__file__).resolve().parent
load_dotenv(backend_dir / ".env")
load_dotenv(backend_dir.parent / ".env")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("kavach")

app = FastAPI(title="Kavach Scam Detection Backend")
configured_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(
        {
            "http://localhost:8443",
            "http://127.0.0.1:8443",
            *configured_origins,
        }
    ),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CallData(BaseModel):
    call_id: str | None = None
    caller_number: str
    caller_name: str | None = None
    direction: str = "incoming"
    start_time: str | None = None
    duration: int | None = None
    transcript: str = ""


class TestCallRequest(BaseModel):
    phone_number: str = Field(min_length=1)
    demo: bool = True


clients: List[WebSocket] = []
active_demo_call_sid: str | None = None

PATTERNS = {
    "digital arrest": (40, "Digital-arrest language"),
    "under arrest": (35, "Arrest threat"),
    "cyber crime": (20, "Cyber-crime impersonation"),
    "police": (15, "Authority impersonation"),
    "otp": (20, "OTP request"),
    "one time password": (20, "OTP request"),
    "transfer money": (25, "Money transfer request"),
    "send money": (25, "Money transfer request"),
    "urgent": (15, "Urgency pressure"),
    "immediately": (10, "Urgency pressure"),
    "account blocked": (20, "Account-blocking threat"),
    "money laundering": (25, "Money-laundering claim"),
}


def analyze_scam(transcript: str) -> tuple[int, str, list[str]]:
    if not transcript.strip():
        return 0, "UNKNOWN", ["Transcript unavailable"]

    text = transcript.lower()
    score = 0
    reasons: list[str] = []
    seen_reasons: set[str] = set()

    for phrase, (points, reason) in PATTERNS.items():
        if phrase in text:
            score += points
            if reason not in seen_reasons:
                reasons.append(reason)
                seen_reasons.add(reason)

    score = min(score, 100)
    level = "HIGH" if score >= 70 else "MEDIUM" if score >= 40 else "LOW"
    return score, level, reasons


@app.get("/")
def home() -> dict[str, str]:
    return {"message": "Kavach backend running"}


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


async def broadcast(message: dict) -> None:
    logger.info("WEBSOCKET_BROADCAST_STARTED event=%s", message["event"])
    stale_clients: list[WebSocket] = []
    for client in clients:
        try:
            await client.send_json(message)
        except Exception as error:
            logger.exception("WEBSOCKET_BROADCAST_ERROR error=%s", error)
            stale_clients.append(client)

    for client in stale_clients:
        if client in clients:
            clients.remove(client)
    logger.info("WEBSOCKET_BROADCAST_COMPLETED event=%s clients=%d", message["event"], len(clients))


def normalized_call(call: CallData) -> dict:
    return {
        "call_id": call.call_id or f"call-{datetime.now(timezone.utc).timestamp()}",
        "caller_number": call.caller_number or "Unknown",
        "caller_name": call.caller_name or "Unknown Caller",
        "direction": call.direction or "unknown",
        "start_time": call.start_time or datetime.now(timezone.utc).isoformat(),
        "duration": call.duration,
        "transcript": call.transcript,
    }


def normalize_phone_number(phone_number: str) -> str:
    normalized = re.sub(r"[\s().-]", "", phone_number.strip())
    if not re.fullmatch(r"\+[1-9]\d{7,14}", normalized):
        raise HTTPException(
            status_code=422,
            detail="phone_number must be a valid international number such as +919876543210",
        )
    return normalized


def twilio_config() -> tuple[str, str, str]:
    account_sid = os.getenv("TWILIO_ACCOUNT_SID", "").strip()
    auth_token = os.getenv("TWILIO_AUTH_TOKEN", "").strip()
    from_number = os.getenv("TWILIO_FROM_NUMBER", "").strip()
    if not account_sid or not auth_token or not from_number:
        raise HTTPException(
            status_code=503,
            detail="Twilio is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER.",
        )
    return account_sid, auth_token, from_number


def media_stream_url() -> str:
    url = os.getenv("TWILIO_MEDIA_STREAM_URL", "").strip()
    if not url.startswith("wss://"):
        raise HTTPException(
            status_code=503,
            detail="Real-time call analysis is not configured. Set TWILIO_MEDIA_STREAM_URL to a public wss:// URL.",
        )
    return url


async def publish_scam_analysis(call_sid: str, transcript: str) -> None:
    analysis = analyze_transcript(transcript)
    await broadcast(
        {
            "event": "SCAM_ANALYSIS",
            "type": "scam_analysis",
            "call_sid": call_sid,
            **analysis,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    )


async def transcribe_media_stream(websocket: WebSocket, call_sid: str, stream_sid: str) -> None:
    deepgram_key = os.getenv("DEEPGRAM_API_KEY", "").strip()
    if not deepgram_key:
        logger.error("MEDIA_STT_UNAVAILABLE call_sid=%s missing DEEPGRAM_API_KEY", call_sid)
        await broadcast({"event": "SCAM_ANALYSIS_ERROR", "call_sid": call_sid, "message": "Speech-to-text is not configured."})
        return

    import websockets

    deepgram_url = (
        "wss://api.deepgram.com/v1/listen?encoding=mulaw&sample_rate=8000&channels=1"
        "&interim_results=true&punctuate=true&model=nova-2"
    )
    transcript = ""
    interim = ""
    media_packet_count = 0

    try:
        async with websockets.connect(
            deepgram_url,
            additional_headers={"Authorization": f"Token {deepgram_key}"},
        ) as deepgram:
            async def receive_transcripts() -> None:
                nonlocal transcript, interim
                async for raw_message in deepgram:
                    result = json.loads(raw_message)
                    alternatives = result.get("channel", {}).get("alternatives", [])
                    text = alternatives[0].get("transcript", "").strip() if alternatives else ""
                    if not text:
                        continue
                    if result.get("is_final"):
                        transcript = f"{transcript} {text}".strip()
                        interim = ""
                    else:
                        interim = text
                    await publish_scam_analysis(call_sid, f"{transcript} {interim}".strip())

            transcript_task = asyncio.create_task(receive_transcripts())
            try:
                while True:
                    try:
                        raw_message = await websocket.receive_text()
                        message = json.loads(raw_message)
                    except json.JSONDecodeError as error:
                        logger.error(
                            "TWILIO_MEDIA_MESSAGE_PARSE_ERROR type=%s message=%s",
                            type(error).__name__,
                            str(error),
                        )
                        continue
                    except WebSocketDisconnect:
                        raise
                    except Exception as error:
                        logger.error(
                            "TWILIO_MEDIA_MESSAGE_RECEIVE_ERROR type=%s message=%s",
                            type(error).__name__,
                            str(error),
                        )
                        raise

                    event_type = message.get("event", "unknown")
                    logger.info("TWILIO_MEDIA_MESSAGE type=%s", event_type)
                    if event_type == "media":
                        media_packet_count += 1
                        if media_packet_count == 1 or media_packet_count % 100 == 0:
                            logger.info(
                                "TWILIO_MEDIA_PACKET_RECEIVED call_sid=%s stream_sid=%s packet_count=%d",
                                call_sid,
                                stream_sid,
                                media_packet_count,
                            )
                        payload = message.get("media", {}).get("payload")
                        if payload:
                            await deepgram.send(base64.b64decode(payload))
                    elif event_type == "stop":
                        logger.info(
                            "TWILIO_MEDIA_STOP call_sid=%s stream_sid=%s packet_count=%d",
                            call_sid,
                            stream_sid,
                            media_packet_count,
                        )
                        break
                    elif event_type not in {"connected", "start"}:
                        logger.warning("TWILIO_MEDIA_MESSAGE_IGNORED type=%s", event_type)
            finally:
                await deepgram.send(json.dumps({"type": "CloseStream"}))
                await asyncio.wait_for(transcript_task, timeout=3)
    except WebSocketDisconnect:
        raise
    except Exception:
        logger.exception("MEDIA_STT_ERROR call_sid=%s", call_sid)
        await broadcast({"event": "SCAM_ANALYSIS_ERROR", "call_sid": call_sid, "message": "Speech-to-text processing failed."})


async def process_call(call: CallData) -> dict:
    logger.info("CALL_RECEIVED call_id=%s", call.call_id or "generated")
    call_payload = normalized_call(call)
    await broadcast({"event": "CALL_STARTED", "call": call_payload})

    logger.info("CALL_ANALYSIS_STARTED call_id=%s", call_payload["call_id"])
    score, level, reasons = analyze_scam(call.transcript)
    logger.info("CALL_ANALYSIS_COMPLETED call_id=%s risk_level=%s", call_payload["call_id"], level)
    result = {
        "event": "CALL_ANALYZED",
        "call": {
            **call_payload,
            "risk_score": score,
            "risk_level": level,
            "reasons": reasons,
        },
    }
    await broadcast(result)
    return result


@app.post("/api/calls")
async def receive_call(call: CallData) -> dict:
    return await process_call(call)


@app.post("/api/test-call")
async def test_call(request: TestCallRequest) -> dict:
    global active_demo_call_sid
    phone_number = normalize_phone_number(request.phone_number)
    account_sid, auth_token, from_number = twilio_config()
    stream_url = media_stream_url()
    parsed_media_url = urlparse(stream_url)
    logger.info(
        "TWILIO_MEDIA_STREAM_CONFIGURED media_stream_url_configured=%s media_stream_url_scheme=%s media_stream_url_host=%s media_stream_url_path=%s",
        bool(stream_url),
        parsed_media_url.scheme,
        parsed_media_url.hostname or "",
        parsed_media_url.path or "",
    )
    twiml = (
        "<Response><Start><Stream url=\""
        + stream_url
        + "\" track=\"both_tracks\" /></Start>"
        "<Say voice=\"alice\" language=\"en-IN\">"
        "Hello, this is a security verification call. "
        "We detected suspicious activity on your bank account. "
        "Your account will be blocked today unless you complete verification. "
        "Please provide the one-time password sent to your phone. "
        "Do not share this password with anyone except the verification officer."
        "</Say><Pause length=\"30\" /></Response>"
    )
    logger.info(
        "TWILIO_TWIML_MEDIA_STREAM_ENABLED track=both_tracks media_stream_url_path=%s has_start_stream=%s",
        parsed_media_url.path or "",
        "<Start><Stream" in twiml,
    )
    call_options: dict = {"to": phone_number, "from_": from_number, "twiml": twiml}
    status_callback = os.getenv("TWILIO_STATUS_CALLBACK_URL", "").strip()
    if status_callback:
        call_options.update(
            status_callback=status_callback,
            status_callback_event=["initiated", "ringing", "answered", "completed"],
            status_callback_method="POST",
        )

    try:
        call = Client(account_sid, auth_token).calls.create(**call_options)
    except TwilioRestException as error:
        logger.error("TWILIO_CALL_FAILED code=%s status=%s", error.code, error.status)
        raise HTTPException(status_code=502, detail=str(error.msg or error)) from error
    except Exception as error:
        logger.exception("TWILIO_CALL_FAILED")
        raise HTTPException(status_code=502, detail=str(error)) from error

    logger.info("TWILIO_CALL_ACCEPTED call_sid=%s status=%s", call.sid, call.status)
    active_demo_call_sid = call.sid
    await broadcast(
        {
            "event": "DEMO_CALL_INITIATED",
            "call_sid": call.sid,
            "phone_number": phone_number,
            "status": call.status,
            "call_type": "DEMO",
        }
    )
    return {
        "success": True,
        "call_sid": call.sid,
        "status": call.status,
        "phone_number": phone_number,
        "call_type": "DEMO",
    }


@app.post("/api/test-call/disconnect")
async def disconnect_demo_call() -> dict:
    global active_demo_call_sid
    if not active_demo_call_sid:
        raise HTTPException(status_code=404, detail="No active demo call is available to disconnect.")
    account_sid, auth_token, _ = twilio_config()
    call_sid = active_demo_call_sid
    try:
        call = Client(account_sid, auth_token).calls(call_sid).update(status="completed")
    except TwilioRestException as error:
        logger.error("TWILIO_CALL_DISCONNECT_FAILED call_sid=%s code=%s", call_sid, error.code)
        raise HTTPException(status_code=502, detail=str(error.msg or error)) from error
    if call.status not in {"completed", "canceled"}:
        raise HTTPException(status_code=502, detail=f"Twilio did not confirm call termination: {call.status}")
    active_demo_call_sid = None
    await broadcast({"event": "DEMO_CALL_DISCONNECTED", "call_sid": call_sid, "status": call.status, "call_type": "DEMO"})
    return {"success": True, "call_sid": call_sid, "status": call.status}


@app.post("/api/twilio/status", response_class=PlainTextResponse)
async def twilio_status(request: Request) -> str:
    form = parse_qs((await request.body()).decode("utf-8"))
    call_sid = form.get("CallSid", [""])[0]
    status = form.get("CallStatus", [""])[0]
    if call_sid and status:
        logger.info("TWILIO_CALL_STATUS call_sid=%s status=%s", call_sid, status)
        await broadcast(
            {
                "event": "DEMO_CALL_STATUS",
                "call_sid": call_sid,
                "status": status,
                "call_type": "DEMO",
            }
        )
    return "OK"


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    try:
        await websocket.accept()
        clients.append(websocket)
        logger.info("WEBSOCKET_CLIENT_CONNECTED clients=%d", len(clients))
        while True:
            message = await websocket.receive_text()
            logger.info("WEBSOCKET_MESSAGE_RECEIVED message=%s", message)
    except WebSocketDisconnect:
        if websocket in clients:
            clients.remove(websocket)
        logger.info("WEBSOCKET_CLIENT_DISCONNECTED clients=%d", len(clients))
    except Exception:
        if websocket in clients:
            clients.remove(websocket)
        logger.exception("WEBSOCKET_ERROR clients=%d", len(clients))


@app.websocket("/ws/media")
async def twilio_media_stream(websocket: WebSocket) -> None:
    await websocket.accept()
    logger.info("TWILIO_MEDIA_WEBSOCKET_ACCEPTED")
    call_sid = "unknown"
    stream_sid = "unknown"
    received_start = False
    try:
        while True:
            try:
                raw_message = await websocket.receive_text()
                start_message = json.loads(raw_message)
            except json.JSONDecodeError as error:
                logger.error(
                    "TWILIO_MEDIA_MESSAGE_PARSE_ERROR type=%s message=%s",
                    type(error).__name__,
                    str(error),
                )
                continue

            event_type = start_message.get("event", "unknown")
            logger.info("TWILIO_MEDIA_MESSAGE type=%s", event_type)
            if event_type == "connected":
                logger.info("TWILIO_MEDIA_CONNECTED_EVENT")
                continue
            if event_type == "start":
                start_data = start_message.get("start", {})
                call_sid = start_data.get("callSid", "unknown")
                stream_sid = start_data.get("streamSid", "unknown")
                tracks = start_data.get("tracks", [])
                media_format = start_data.get("mediaFormat", {})
                logger.info(
                    "TWILIO_MEDIA_START_EVENT call_sid=%s stream_sid=%s tracks=%s encoding=%s sample_rate=%s channels=%s",
                    call_sid,
                    stream_sid,
                    tracks,
                    media_format.get("encoding", "unknown"),
                    media_format.get("sampleRate", "unknown"),
                    media_format.get("channels", "unknown"),
                )
                received_start = True
                break
            if event_type == "stop":
                logger.info("TWILIO_MEDIA_STOP_BEFORE_START call_sid=%s stream_sid=%s", call_sid, stream_sid)
                break
            logger.warning("TWILIO_MEDIA_MESSAGE_IGNORED_BEFORE_START type=%s", event_type)
        logger.info("TWILIO_MEDIA_CONNECTED call_sid=%s", call_sid)
        if received_start:
            await transcribe_media_stream(websocket, call_sid, stream_sid)
    except WebSocketDisconnect:
        logger.info(
            "TWILIO_MEDIA_DISCONNECTED call_sid=%s stream_sid=%s start_received=%s",
            call_sid,
            stream_sid,
            received_start,
        )
    except Exception as error:
        logger.exception(
            "TWILIO_MEDIA_ERROR type=%s message=%s call_sid=%s stream_sid=%s",
            type(error).__name__,
            str(error),
            call_sid,
            stream_sid,
        )
