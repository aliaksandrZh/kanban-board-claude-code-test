---
title: "Local-First Kanban System PRD"
slug: "local-first-kanban-system-prd"
summary: "Complete PRD for a zero-backend Kanban MVP using Angular 21 and RxDB persistence."
description: "Architecture and feature spec for a self-contained Kanban tool that runs entirely in the browser. Covers Angular 21, RxDB persistence, drag-and-drop boards, card workflows, project wikis, and URL-addressable deep links."
---

Product Requirements Document (PRD)
Trello-like Local Kanban System (MVP)

## Product Overview

A lightweight Trello-like project management application focused on:

* **Kanban workflow**
* **Local-first persistence**
* **Wiki pages per project**
* **Zero backend**
* **Simple user switching**
* **URL-addressable projects/cards/wiki pages**

The application is intended as an MVP productivity tool for local desktop usage.

## Goals

### Primary Goals

* Manage projects locally
* Track tasks/features/bugs through Kanban workflow
* Maintain lightweight project wiki/documentation
* Support multiple local users
* Persist data without backend infrastructure

### Non-Goals

* Authentication
* RBAC/permissions
* Realtime collaboration
* Notifications
* File synchronization
* Cloud storage
* Mobile-first optimization
* Activity feeds
* Version history

## Tech Stack

### Packet manager
* Do not use npm. Use pnpm/yarn/bun.

### Frontend

* **Angular 21**
* Standalone components
* Signals-based architecture
* Signal Store (`@ngrx/signals`-style architecture)

### Persistence

* **RxDB**
* IndexedDB adapter

### Routing

Angular Router with deep-link support.

## Application Structure

### Main Areas

#### Global Dashboard

Contains:

* Project management
* User management
* Current user selector

#### Project Area

Each project contains:

* Kanban board
* Wiki pages

## User Roles

No RBAC.

Every user has full access to:

* all projects
* all cards
* all wiki pages
* all users

## User Management

### Features

Users are stored locally.

### Create User

Flow:

1. Click **Create User**
2. Enter username
3. User is created immediately

### User Selection

At the top navigation:

* Current user dropdown
* Changing current user updates:
  * `createdBy`
  * `modifiedBy`
  * comments author

### Default User

System creates:

`root`

on first startup.

## Projects

### Project Entity

Fields:

* `id`
* `name`
* `description`
* `createdAt`
* `createdBy`
* `modifiedAt`
* `modifiedBy`

### Project Features

* Create project
* Delete project
* Open project
* Open project directly by URL

### Routes

* `/projects`
* `/project/:projectId`

## Kanban Board

Each project contains exactly **ONE** board.

## Card Model

### Card Fields

| Field            | Type             |
| ---------------- | ---------------- |
| `id`             | string           |
| `title`          | string           |
| `description`    | text             |
| `type`           | enum             |
| `status`         | enum             |
| `assigneeId`     | string/null      |
| `labels`         | string\[]        |
| `checklist`      | ChecklistItem\[] |
| `relatedCardIds` | string\[]        |
| `createdAt`      | datetime         |
| `createdBy`      | userId           |
| `modifiedAt`     | datetime         |
| `modifiedBy`     | userId           |

## Card Types

Supported:

* `feature`
* `task`
* `bug`

## Card Statuses

Supported statuses:

* `new`
* `active`
* `ready_to_test`
* `completed`
* `closed`

## Status Transition Rules

### Allowed Transitions

| From            | To              |
| --------------- | --------------- |
| `new`           | `active`        |
| `new`           | `closed`        |
| `active`        | `ready_to_test` |
| `active`        | `new`           |
| `active`        | `closed`        |
| `ready_to_test` | `active`        |
| `ready_to_test` | `closed`        |
| `ready_to_test` | `completed`     |

### Invalid Transitions

All unspecified transitions are forbidden.

## Board UX

### Layout

Classic Kanban columns:

* **New**
* **Active**
* **Ready to Test**
* **Completed**
* **Closed**

### Drag & Drop

Cards support:

* drag between allowed columns
* automatic status update

Invalid drops:

* prevented by UI

### Card Display

Card preview shows:

* title
* type
* assignee
* labels
* checklist progress

## Card Details Page

Each card has dedicated route.

### Routes

* `/project/:projectId/card/:cardId`

### Card Details Includes

* title
* description
* type
* status
* assignee
* labels
* checklist
* comments
* related cards
* metadata

## Comments

### Comment Model

| Field       | Type     |
| ----------- | -------- |
| `id`        | string   |
| `cardId`    | string   |
| `text`      | string   |
| `createdAt` | datetime |
| `createdBy` | userId   |

### Features

* Add comment
* Delete comment

### Limitations

* Plain text only
* No editing
* No markdown

## Checklist

### Checklist Item

| Field       | Type    |
| ----------- | ------- |
| `id`        | string  |
| `text`      | string  |
| `completed` | boolean |

### Features

* Add item
* Delete item
* Toggle completed

## Labels

### Features

* Create labels inline
* Assign multiple labels to card
* Free-text labels
* No centralized label management

## Related Cards

Cards can reference other cards.

### Features

* Link existing cards
* Open linked card by click

## Wiki

Each project contains wiki pages.

## Wiki Page Model

| Field        | Type     |
| ------------ | -------- |
| `id`         | string   |
| `projectId`  | string   |
| `title`      | string   |
| `content`    | text     |
| `createdAt`  | datetime |
| `createdBy`  | userId   |
| `modifiedAt` | datetime |
| `modifiedBy` | userId   |

## Wiki Features

### Features

* Create page
* Edit page
* Delete page
* Navigate between pages
* Open page directly by URL

### URLs

* `/project/:projectId/wiki/:wikiPageId`

### Content

MVP supports:

* plain text
* optional markdown rendering

No:

* nested wiki tree
* page hierarchy
* versioning
* collaboration

## Navigation Structure

### Top Navigation

Contains:

* app logo
* current user dropdown
* dashboard link

### Dashboard

Contains:

* projects list
* users list

### Project Navigation

Contains:

* board tab
* wiki tab

## Persistence

### Storage Strategy

**RxDB** over **IndexedDB**.

Purpose:

* avoid `localStorage`
* provide reactive persistence layer
* support future sync capabilities

### Offline Support

Entire application works offline.

## State Management

### Pattern

Signal-based stores.

Recommended structure:

```text
stores/
  app.store.ts
  users.store.ts
  projects.store.ts
  cards.store.ts
  wiki.store.ts
```

### Responsibilities

Stores handle:

* querying RxDB
* reactive UI updates
* mutations
* filtering
* optimistic UI

## URL Requirements

All entities must support direct navigation.

### Supported Deep Links

* Project
* Card
* Wiki page

### Application must

* restore state on refresh
* resolve entity from DB
* redirect gracefully if entity missing

## UI Requirements

### Target Resolution

Optimized for:

* Full HD
* 2K
* 4K desktop

### Layout

* Multi-column board
* Wide content areas
* Sidebar-friendly spacing

### Theme

Light theme only.

### Responsiveness

Basic responsive behavior acceptable.

Mobile optimization is not required.

## Recommended Component Structure

```text
core/
shared/
features/
  dashboard/
  project/
  kanban/
  card/
  wiki/
  users/
```

## Recommended Pages

| Page          | Contents                   |
| ------------- | -------------------------- |
| Dashboard     | projects list, users panel |
| Project Board | kanban board               |
| Card Details  | full card editing          |
| Wiki List     | wiki page list             |
| Wiki Page     | page editor                |

## Recommended RxDB Collections

* `users`
* `projects`
* `cards`
* `comments`
* `wikiPages`

## MVP Constraints

### Explicitly Excluded

* backend
* authentication
* permissions
* cloud sync
* websockets
* realtime updates
* notifications
* avatars
* analytics
* reporting
* attachments requiring backend
* advanced markdown editor

## Future Extensions (Post-MVP)

Potential future features:

* sync server
* collaborative editing
* attachments
* markdown wiki
* search
* filters
* swimlanes
* board customization
* RBAC
* activity logs
* notifications
* time tracking
* archived cards
* board templates

## Acceptance Criteria

### Dashboard

* User can create/delete projects
* User can create/select users

### Board

* User can create/edit/delete cards
* Drag & drop updates status
* Invalid transitions blocked

### Cards

* Cards accessible by URL
* Comments work locally
* Checklist persists

### Wiki

* Wiki pages accessible by URL
* Wiki content persists

### Persistence

* Data survives browser refresh/reopen

### Technical

* No backend required
* Entire app works locally
* State updates reactively using Signals/RxDB
