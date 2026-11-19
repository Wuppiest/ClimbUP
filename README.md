# ClimbUP

3D-Kletterspiel im Only-Up-Stil, als **eine einzige HTML-Datei**: `index.html` im Browser öffnen, fertig (läuft offline).

Du hüpfst auf einem Pogo-Stick über einen Turm aus zusammengewürfeltem Krempel nach oben – durch 6 Gebiete bis zur Gummiente.

## Steuerung
| Taste | Aktion |
|---|---|
| Maus | Umschauen |
| W A S D | Langsam rollen / Sprungrichtung |
| Leertaste | Halten = Sprung aufladen (Blick sinkt nach unten), loslassen = springen; länger halten = höher |
| Shift (an Wand) | Grinden; loslassen = von der Wand abstoßen |
| E | Checkpoint-Flagge setzen (auf flachem Boden; in der Luft: bei der Landung) / aufheben |
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
