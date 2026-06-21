# Die Zaubertafel – Technische Spezifikation

## 1. Übersicht

**Die Zaubertafel** ist ein interaktives Mathe-Lernspiel für Kinder (Klasse 1–6), das direkt im Browser läuft. Es simuliert eine grüne Schultafel, auf der Kinder mit Kreide schreiben, rechnen und zeichnen können. Das Spiel wird als statische Single-Page-Application über GitHub Pages bereitgestellt.

**Technologie:** Reines HTML5, CSS3, JavaScript (Vanilla, kein Framework). Kein Backend, kein Build-Schritt.

**Ziel-URL:** `https://johannesrabauer.github.io/l-die-zaubertafel/`

---

## 2. Architektur

```
/
├── index.html          # Einstiegsseite mit Spielauswahl
├── style.css           # Alle Styles
├── app.js              # Hauptlogik (Spielmodi, UI-Steuerung)
├── canvas.js           # Tafel-Zeichenlogik (Kreide, Radierer)
├── math.js             # Aufgabengenerierung nach Klassenstufe
├── rewards.js          # Punkte, Animationen, Feedback
├── SPEC.md             # Diese Spezifikation
├── README.md           # Projektbeschreibung
└── .github/
    └── workflows/
        └── deploy.yml  # GitHub Pages Deployment
```

---

## 3. Benutzeroberfläche

### 3.1 Startbildschirm

- **Titel:** "Die Zaubertafel 🖍️" in Kreide-Optik
- **Klassenstufen-Auswahl:** Buttons für Klasse 1, 2, 3, 4, 5–6, Freier Modus
- **Spielmodus-Auswahl:** Übungsmodus, Punktemodus, Zeitmodus, Freies Schreiben
- **Start-Button:** Startet das Spiel mit gewählter Kombination
- Responsives Layout (Mobile-First)

### 3.2 Spielbildschirm

| Bereich | Position | Inhalt |
|---------|----------|--------|
| Header-Leiste | Oben | Punkte, Timer (falls Zeitmodus), Klassenstufe, Zurück-Button |
| Aufgaben-Bereich | Oberhalb der Tafel | Aktuelle Aufgabe in großer Schrift |
| Tafel | Mitte (Hauptbereich) | Grüne Canvas-Fläche zum Zeichnen |
| Werkzeugleiste | Unter der Tafel | Kreide, Radierer, Alles löschen, Strichstärke |
| Eingabe-Bereich | Unter Werkzeugleiste | Nummernfeld für Antwort-Eingabe + Bestätigen-Button |
| Feedback-Bereich | Overlay | Animierte Erfolgsmeldungen / Hinweise |

### 3.3 Farben und Design

- **Tafel:** `#2d5a27` (dunkelgrün) mit leichter Textur (CSS-Gradient)
- **Kreide:** `#ffffff` (weiß), Strichstärke 3–8px, leicht raue Kante (randomisierter Offset)
- **Rahmen:** `#8B4513` (holzbraun), 12px solid
- **Hintergrund:** `#f5f0e8` (warm beige)
- **Buttons:** Kindgerecht, groß (min. 44px Touch-Target), abgerundet, farbig

---

## 4. Funktionale Anforderungen

### 4.1 Tafel (Canvas)

| Feature | Beschreibung |
|---------|-------------|
| Zeichnen | Maus/Touch-Eingabe → weiße Linie auf grünem Canvas |
| Kreide-Effekt | Leicht ungleichmäßige Linie (randomisierter Alpha/Offset per Pixel) |
| Radierer | Wechsel auf Radierer-Modus → löscht in 20px-Radius |
| Alles löschen | Wisch-Animation (von links nach rechts), dann leere Tafel |
| Responsiv | Canvas skaliert auf verfügbare Breite, min-height 300px |
| Touch-Support | `touchstart`, `touchmove`, `touchend` Events behandeln |
| Pointer Events | `pointerdown`, `pointermove`, `pointerup` als primäre Events |

### 4.2 Aufgabengenerierung

#### Klassenstufe 1 (Zahlenraum 0–20)
- Addition: `a + b = ?` wobei `a + b ≤ 20`
- Subtraktion: `a - b = ?` wobei `a ≥ b`, `a ≤ 20`
- Zahlen erkennen: "Schreibe die Zahl X auf die Tafel" (Freies Schreiben)

#### Klassenstufe 2 (Zahlenraum 0–100)
- Addition/Subtraktion mit Zehnerübergang
- Ergänzungsaufgaben: `a + ? = b`
- Knobelaufgaben: "Welche Zahl fehlt? 3, 6, ?, 12"

#### Klassenstufe 3 (Einmaleins, Division)
- Multiplikation: `a × b = ?` (kleines Einmaleins)
- Division: `a ÷ b = ?` (ohne Rest)
- Gemischte Aufgaben im Zahlenraum bis 1000

#### Klassenstufe 4 (Schriftliches Rechnen)
- Schriftliche Addition/Subtraktion (mehrstellig)
- Multiplikation mit zweistelligem Faktor
- Division mit Rest
- Textaufgaben (einfach formuliert)

#### Klassenstufe 5–6 (Brüche, Dezimal, Prozent)
- Brüche addieren/subtrahieren: `a/b + c/d = ?`
- Dezimalzahlen: `2.5 + 1.3 = ?`
- Prozentrechnung: "Was sind 25% von 80?"
- Negative Zahlen

#### Freier Modus
- Spieler wählt: Rechenart (+-×÷), Zahlenraum (1–10, 1–100, 1–1000, etc.)
- Eigene Parameter einstellbar

### 4.3 Antwort-Erkennung

- **Primär:** Numerisches Eingabefeld mit Tastatur/Nummernblock
- **Eingabeformat:** Ganzzahlen, Dezimalzahlen (mit Komma oder Punkt), Brüche (z.B. "3/4")
- **Validierung:** Exakter Vergleich mit mathematisch korrektem Ergebnis
- **Toleranz bei Dezimalzahlen:** ±0.01

### 4.4 Spielmodi

#### Übungsmodus
- Unbegrenzte Aufgaben
- Kein Timer, kein Druck
- Nach jeder richtigen Antwort: nächste Aufgabe
- Bei falscher Antwort: Hinweis "Versuche es nochmal!" + Aufgabe bleibt
- Fortschritt: Anzahl gelöster Aufgaben angezeigt

#### Punktemodus
- Richtige Antwort: +10 Punkte
- Streak-Bonus: 3× richtig → +5 extra, 5× → +10 extra, 10× → +20 extra
- Falsche Antwort: Streak zurückgesetzt, keine Punktabzüge
- Highscore wird in `localStorage` gespeichert
- Sitzung endet freiwillig (Zurück-Button)

#### Zeitmodus
- Zeitlimit: 60 Sekunden (konfigurierbar: 30s, 60s, 120s)
- Countdown sichtbar oben rechts
- So viele Aufgaben wie möglich lösen
- Am Ende: Zusammenfassung (Aufgaben gelöst, Punkte, Genauigkeit)
- Highscore in `localStorage`

#### Freies Schreiben
- Nur die Tafel, keine Aufgaben
- Werkzeugleiste mit Kreide + Radierer
- Optional: Farbauswahl (weiß, gelb, rosa, blau)
- Zum Malen, Üben, Ausprobieren

---

## 5. Feedback und Motivation

### 5.1 Richtige Antwort
1. Aufgabe wird "weggewischt" (CSS-Animation: fade + slide)
2. Zufällige Erfolgsmeldung erscheint (1.5s sichtbar):
   - "Super gemacht! ⭐"
   - "Rechenprofi! 🏆"
   - "Genial! 🎉"
   - "Weiter so! 🚀"
   - "Mathematik-Star! ✨"
3. Punkte-Animation: +10 fliegt nach oben
4. Bei Streak: Spezial-Animation (Konfetti-Effekt mit CSS)

### 5.2 Falsche Antwort
- Sanfte Rückmeldung: "Hmm, versuche es nochmal! 🤔"
- Keine negative Bestrafung
- Aufgabe bleibt stehen
- Nach 3 Fehlversuchen: Hinweis anzeigen (z.B. "Tipp: Zähle von X weiter")

### 5.3 Meilensteine
- Alle 10 Aufgaben: "10 Aufgaben geschafft! 🌟"
- Neuer Highscore: "Neuer Rekord! 🏅"
- Streak von 5: "5er-Serie! Du bist unaufhaltsam! 🔥"

---

## 6. Persistenz (localStorage)

```javascript
{
  "zaubertafel_highscores": {
    "klasse1_punkte": 150,
    "klasse1_zeit": 12,
    "klasse2_punkte": 80,
    // ...
  },
  "zaubertafel_settings": {
    "lastGrade": 2,
    "lastMode": "uebung",
    "zeitLimit": 60
  }
}
```

---

## 7. Responsive Design

| Breakpoint | Layout |
|-----------|--------|
| ≥1024px | Volle Tafel (800×500px), Werkzeuge seitlich möglich |
| 768–1023px | Tafel füllt 90% Breite, Werkzeuge darunter |
| <768px | Tafel füllt 100% Breite, kompakte Werkzeugleiste, größere Touch-Buttons |

### Touch-Optimierung
- Alle Buttons: min. 44×44px
- Kein Hover-abhängiges UI
- Touch-Delay entfernt (`touch-action: manipulation`)
- Scroll-Lock während Tafel-Interaktion (`preventDefault` auf Canvas)

---

## 8. Barrierefreiheit

- Semantisches HTML5 (`<main>`, `<nav>`, `<button>`, `<label>`)
- ARIA-Labels für Canvas und interaktive Elemente
- Fokus-Management bei Moduswechsel
- Kontrastverhältnis ≥ 4.5:1 für Text
- Tastatur-Navigation für Eingabefeld und Buttons
- `prefers-reduced-motion`: Animationen deaktivieren

---

## 9. Performance

- Kein Framework, kein Bundler → sofortige Ladezeit
- Canvas statt DOM für Zeichenfläche
- RequestAnimationFrame für flüssige Zeichnung
- Gesamtgröße < 50KB (ohne Bilder)
- Keine externen Abhängigkeiten

---

## 10. Deployment

### GitHub Actions Workflow
- **Trigger:** Push auf `main`
- **Aktion:** Inhalte des Root-Verzeichnisses als GitHub Pages Artifact hochladen
- **Methode:** `actions/upload-pages-artifact` + `actions/deploy-pages`
- **Keine Build-Phase nötig** (statische Dateien)

### Voraussetzungen
- GitHub Pages aktiviert (Source: GitHub Actions)
- Repository Settings → Pages → Source: "GitHub Actions"

---

## 11. Nicht-funktionale Anforderungen

| Anforderung | Zielwert |
|-------------|----------|
| Ladezeit | < 1s (First Contentful Paint) |
| Unterstützte Browser | Chrome 90+, Firefox 90+, Safari 14+, Edge 90+ |
| Offline-fähig | Nein (kein Service Worker in v1) |
| Datenschutz | Keine externen Requests, keine Tracking, nur localStorage |
| Sprache | Deutsch |
| Schriftart | System-Font-Stack (keine externen Fonts laden) |

---

## 12. Abgrenzung (Out of Scope für v1)

- Handschrift-Erkennung (Antworten werden über Tastatur/Nummernfeld eingegeben)
- Mehrspieler-Modus
- Benutzerkonten / Server-seitige Speicherung
- Audio / Sound-Effekte
- Offline-Modus (Service Worker)
- Druckfunktion
- Eltern-Dashboard / Statistiken
