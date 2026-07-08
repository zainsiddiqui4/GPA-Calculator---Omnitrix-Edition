# FAST NUCES GPA Calculator — Ben 10 Alien Force Edition

A responsive, browser-based GPA and CGPA calculator built for FAST NUCES students, following the university's official grading criteria. The interface is styled with a Ben 10: Alien Force theme.

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

## Grading Criteria

| Grade | Percentage | GP | QP (3 CH) |
|-------|-----------|------|-----------|
| A+ | 90% - 100% | 4.00 | 12.00 |
| A | 86% - 89% | 4.00 | 12.00 |
| A- | 82% - 85% | 3.67 | 11.01 |
| B+ | 78% - 81% | 3.33 | 9.99 |
| B | 74% - 77% | 3.00 | 9.00 |
| B- | 70% - 73% | 2.67 | 8.01 |
| C+ | 66% - 69% | 2.33 | 6.99 |
| C | 62% - 65% | 2.00 | 6.00 |
| C- | 58% - 61% | 1.67 | 5.01 |
| D+ | 54% - 57% | 1.33 | 3.99 |
| D | 50% - 53% | 1.00 | 3.00 |
| F | 0% - 49% | 0.00 | 0.00 |

## Formulas

**GPA (per semester):**
```
GPA = Σ(Grade Points × Credit Hours) ÷ Σ(Credit Hours)
```

**CGPA (cumulative):**
```
CGPA = Total Quality Points of All Semesters ÷ Total Credit Hours Completed
```

## How GPA Is Calculated

1. List all courses taken in the semester.
2. Record the credit hours assigned to each course.
3. Convert each letter grade into its corresponding grade point.
4. Multiply grade points by credit hours to get quality points per course.
5. Sum the quality points across all courses.
6. Divide total quality points by total credit hours to get the GPA.

## How CGPA Is Calculated

1. Collect the GPA and credit hours for each completed semester.
2. Multiply each semester's GPA by its credit hours.
3. Sum the quality points across all semesters.
4. Sum all completed credit hours.
5. Divide total quality points by total credit hours to get the CGPA.

## Tech Stack

- **HTML5** — Structure and layout
- **CSS3** — Styling, animations, Flexbox and CSS Grid for layout
- **JavaScript** — Calculation logic, API integration, and export functionality
- **Fonts** — Orbitron, Exo 2

## Project Structure

```
├── index.html      # Main page structure
├── style.css       # Styling, theming, and responsive breakpoints
└── script.js       # GPA/CGPA calculation logic and API handling
```

## Usage

1. Clone or download the repository.
2. Open `index.html` in any modern web browser.
3. Select SGPA or CGPA mode.
4. Enter course details (grades and credit hours) or semester details (GPA and credit hours).
5. View the calculated result and export if needed.

## Disclaimer

This is an independent, unofficial student project. It is not affiliated with or endorsed by FAST NUCES. Users should verify results against official university records.

## Reference

FAST NUCES official website: [https://www.nu.edu.pk/](https://www.nu.edu.pk/)

## Author

Developed by [Your Name] — a FAST NUCES student project combining practical academic tooling with creative visual design.

## License

This project is open for personal and educational use. Feel free to fork and adapt it for your own institution's grading scale.
