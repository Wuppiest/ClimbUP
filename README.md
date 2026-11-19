# ClimbUP

3D-Kletterspiel im Only-Up-Stil, als **eine einzige HTML-Datei**: `ClimbUP.html` im Browser öffnen, fertig (läuft offline).

Du hüpfst auf einem Pogo-Stick über einen Turm aus zusammengewürfeltem Krempel nach oben – durch 6 Gebiete bis zur Gummiente.

## Steuerung
| Taste | Aktion |
|---|---|
| Maus | Umschauen |
| W A S D | Pogo-Stick neigen / Richtung |
| Leertaste | Genau beim Aufkommen = hoher Sprung, perfektes Timing = noch höher |
| Shift (an Wand) | Grinden; loslassen = von der Wand abstoßen |
| E | Checkpoint-Flagge setzen (bei der nächsten Landung auf flachem Boden) / aufheben |
| R | Respawn (mit Bestätigung): an der Flagge, oder am Start wenn du sie trägst |
| F | Mit der Ente reden |
| Esc | Pause / Einstellungen |

Bestzeit und Einstellungen werden lokal im Browser gespeichert.

## Entwicklung
Der Quellcode liegt in `src/`, Three.js (r159, MIT) in `vendor/`.
Nach Änderungen die Datei neu bauen:

```bash
node build.js
```
