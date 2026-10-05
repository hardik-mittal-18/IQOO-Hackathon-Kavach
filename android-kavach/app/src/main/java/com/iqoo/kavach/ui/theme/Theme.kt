package com.iqoo.kavach.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val LightColors = lightColorScheme(
    primary = KavachPrimary,
    onPrimary = androidx.compose.ui.graphics.Color.White,
    secondary = KavachPrimaryDark,
    background = KavachBackground,
    surface = KavachSurface,
    onSurface = KavachText,
    error = KavachError,
    tertiary = KavachWarning
)

private val DarkColors = darkColorScheme(
    primary = KavachPrimary,
    onPrimary = androidx.compose.ui.graphics.Color.White,
    secondary = KavachPrimaryDark,
    background = androidx.compose.ui.graphics.Color(0xFF111827),
    surface = androidx.compose.ui.graphics.Color(0xFF1F2937),
    onSurface = androidx.compose.ui.graphics.Color.White,
    error = KavachError,
    tertiary = KavachWarning
)

@Composable
fun KavachTheme(
    darkTheme: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColors else LightColors

    MaterialTheme(
        colorScheme = colorScheme,
        typography = KavachTypography,
        content = content
    )
}
