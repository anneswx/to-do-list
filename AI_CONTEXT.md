# AI Context

This document is the primary source of truth for AI assistants working on this project.

---

# GitHub Repository

Repository

https://github.com/anneswx/to-do-list

Default Branch

main

To continue developing A & L Planning, please read the project context first:
https://raw.githubusercontent.com/anneswx/to-do-list/main/AI_CONTEXT.md
---

# Important Files

## Documentation

README.md

AI_CONTEXT.md

---

## Main Source Files

(Add or update these raw links as the project evolves.)

App.jsx

CalendarPage.jsx

TaskRow.jsx

tasks.js

app.css

tasks.css

calendar-page.css

---

# Project Vision

A & L Planning is a planning app designed primarily for couples.

The goal is to combine tasks, shared lists, grocery shopping, calendars, and future habit tracking into one clean, intuitive, and enjoyable experience.

The app should feel closer to Apple Reminders than a project management tool.

Core principles:

- Simple
- Fast
- Beautiful
- Shared by default
- Easy enough for everyday life

---

# Tech Stack

Frontend

- React
- Vite

Backend

- Supabase

Deployment

- GitHub Pages

---

# Development Rules

- Mobile-first.
- Prefer reusable components.
- Avoid duplicate CSS.
- Colors should come from shared design tokens.
- Pages should contain as little business logic as possible.
- Keep components small and reusable.
- Consistency is more important than adding new UI styles.

---

# UI Principles

The app should feel:

- Apple-inspired
- Minimal
- Calm
- Modern
- Rounded
- Spacious
- Easy to scan

Avoid:

- Heavy borders
- Too many colors
- Dense layouts
- Enterprise software appearance

---

# Current Features

Completed

- Today page
- Lists page
- Calendar page
- Add task
- Edit task
- Delete task
- Pin task
- Bottom navigation
- Supabase integration
- Shared assignee support
- Basic calendar views

---

# Current Priority

## Phase 1 — Foundation

- [ ] Remove redundant code
- [ ] Refactor reusable UI components
- [ ] Organize CSS variables
- [ ] Standardize buttons
- [ ] Standardize modals
- [ ] Standardize filters
- [ ] Standardize cards

---

## Phase 2 — Architecture

- [ ] Redesign data model
- [ ] Separate Task and Event concepts
- [ ] Improve Lists architecture
- [ ] Improve Calendar architecture

---

## Phase 3 — MVP

- [ ] Shared Lists
- [ ] Grocery improvements
- [ ] Better Calendar
- [ ] Settings improvements
- [ ] Repeat tasks/events

---

## Future Ideas

- Habit tracking
- Meal planning
- OCR
- Calendar sync
- AI assistant

---

# Working Style

When helping with this project:

1. Understand the existing architecture first.

2. Prefer improving existing code over rewriting everything.

3. Minimize breaking changes.

4. Suggest reusable solutions whenever possible.

5. Explain architectural decisions before writing code.

6. Prioritize maintainability over short-term speed.

7. Before suggesting UI changes, focus on improving consistency rather than adding visual complexity.