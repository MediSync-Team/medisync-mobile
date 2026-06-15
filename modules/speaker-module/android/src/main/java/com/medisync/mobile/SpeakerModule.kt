package com.medisync.mobile

import android.content.Context
import android.media.AudioManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class SpeakerModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("SpeakerModule")

        Function("setSpeakerphoneOn") { enabled: Boolean ->
            val reactContext = appContext.reactContext ?: return@Function
            val audioManager = reactContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager
            audioManager.mode = AudioManager.MODE_IN_COMMUNICATION
            audioManager.isSpeakerphoneOn = enabled
        }
    }
}
