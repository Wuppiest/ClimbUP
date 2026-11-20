# ClimbUP

3D-Kletterspiel im Only-Up-Stil, als **eine einzige HTML-Datei**: `index.html` im Browser öffnen, fertig (läuft offline).

Du hüpfst auf einem Pogo-Stick über einen Turm aus zusammengewürfeltem Krempel nach oben – durch 8 Gebiete bis zur Gummiente.
Unterwegs: pendelnde Stahlträger, fahrende Busse, schaukelnde Bojen, Karussell-Teetassen, Toaster-Sprungpads, Wolken die sich auflösen, kreisende Asteroiden – und goldene Abkürzungen für Mutige.

## Steuerung
| Taste | Aktion |
|---|---|
| Maus | Umschauen |
| W A S D | Langsam rollen / Sprungrichtung |
| Leertaste | Halten = Sprung aufladen (Blick sinkt nach unten), loslassen = springen; länger halten = höher |
| Leertaste in der Luft (an Wand) | Grinden; loslassen = von der Wand abstoßen |
| Shift | Schleichen: langsamer, man rollt nicht über Kanten (wie in Minecraft) |
| E | Checkpoint-Flagge setzen (auf flachem Boden; in der Luft: bei der Landung) / aufheben |
| R | Respawn (mit Bestätigung): an der Flagge, oder am Start wenn du sie trägst |
| F | Mit der Ente reden |
| Esc | Pause / Einstellungen (inkl. Lautstärke) |
| M | Ton an/aus |

### iPad / Touch
Wird automatisch erkannt: links ein Joystick (erscheint unter dem Daumen), rechts wischen zum Umschauen,
Knöpfe für **Sprung** (halten = aufladen / an Wand grinden), **Schleichen** (an/aus), **Flagge**, **Respawn** und **Pause**.
Am besten im Querformat; für Vollbild in Safari „Zum Home-Bildschirm“ hinzufügen.

Bestzeit und Einstellungen werden lokal im Browser gespeichert.

## Entwicklung
Der Quellcode liegt in `src/`, Three.js (r159, MIT) in `vendor/`.
Nach Änderungen die Datei neu bauen:

```bash
node build.js
```
