# GPA Calculator — Omnitrix Edition

A responsive, browser-based GPA and CGPA calculator built for university students, following the university's official grading criteria. The interface is styled with a Ben 10: Alien Force theme.

## Overview

This project allows students to calculate their Semester GPA (SGPA) and Cumulative GPA (CGPA) based on the official FAST NUCES grading scale. It is built using plain HTML, CSS, and JavaScript, with no external frameworks required.

## Features

- **SGPA Mode** — Calculate GPA for an individual semester by entering course grades and credit hours.
- **CGPA Mode** — Calculate cumulative GPA across multiple completed semesters.
- **Official Grading Scale** — Implements the FAST NUCES percentage-to-grade-point conversion table.
- **Responsive Design** — Fully tested across five screen breakpoints for consistent display on mobile, tablet, and desktop.
- **API Integration** — Fetches supporting data via an external API, with offline fallback caching to ensure the tool works without an active connection.
- **Export Functionality** — Export calculated results for saving or sharing.
- **Themed UI** — Custom Ben 10: Alien Force visual identity, including animated interface elements and thematic fonts (Orbitron, Exo 2).

## Formulas

**GPA (per semester):**
```
GPA = Σ(Grade Points × Credit Hours) ÷ Σ(Credit Hours)
```

**CGPA (cumulative):**
```
CGPA = Total Quality Points of All Semesters ÷ Total Credit Hours Completed
```

## Tech Stack

- **HTML5** — Structure and layout
- **CSS3** — Styling, animations, Flexbox and CSS Grid for layout
- **JavaScript** — Calculation logic, API integration, and export functionality
- **Fonts** — Orbitron, Exo 2

## Usage

Open Website: [GPA Calc X Omnnitrix](https://zainsiddiqui4.github.io/GPA-Calculator---Omnitrix-Edition/)

## Author

Developed by Zain Ul Abideen — a WebDev project combining practical academic tooling with creative visual design.

## License

This project is open for personal and educational use. Feel free to fork and adapt it for your own institution's grading scale.
