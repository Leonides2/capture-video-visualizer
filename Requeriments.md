# Instrucciones

Este markdown ilustra el proceso de mejora que se va a realizar en el estado actual del proyecto.

## Estado actual

El estado actual del proyecto es el siguiente:

- La aplicacion muestra en pantalla el video del dispositivo de captura seleccionado
- La aplicacion permite el ajuste del video y permite tanto hacer zoom como tambien reconectar el video
- La aplicacion permite subir y bajar el volumen
- La aplicacion permite silenciar el audio

## Mejoras obligatorias 

- La aplicacion debe realizar la seleccion automatica del audio del dispositivo de video al momento de seleccionar el dispositivo de video.
    - Si el dispositivo de video tiene audio, se debe seleccionar automaticamente el audio del dispositivo de video.
    - Si el dispositivo de video no tiene audio se debe de mutear automaticamente el audio.

## Mejoras opcionales

El proyecto actual usa webRTC para la captura de video y audio. Se debe de cambiar a usar rust con librerias nativas para la captura de video y audio (multiplataforma).

- Debe mantener el mismo comportamiento que el proyecto actual.
- Debe mantener la misma interfaz de usuario que el proyecto actual.
- Debe mantener la misma funcionalidad que el proyecto actual.
- Debe mantener la misma arquitectura que el proyecto actual.

Si y solo si, se logra realizar esta migracion opcional. Se debe realizar las siguientes mejoras:

- Visualizar en un menu la resoluciones disponibles para el dispositivo de video seleccionado.
- Visualizar en un menu las frecuencias de actualizacion disponibles para el dispositivo de video seleccionado.

- Poder seleccionar la resolucion y la frecuencia de actualizacion para el dispositivo de video seleccionado.


