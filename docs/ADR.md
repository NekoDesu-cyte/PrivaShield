# Blurify AI - Architecture Decision Records (ADR)

## ADR 001: Backend Framework Selection
**Status:** Accepted
**Context:** We need a fast, modern, and high-performance Python framework to build the REST API.
**Decision:** Use **FastAPI**.
**Rationale:**
- High performance (based on Starlette and Pydantic).
- Fast to code with automatic OpenAPI (Swagger) documentation.
- Built-in support for asynchronous programming, which is beneficial for non-blocking I/O operations (like image processing background tasks).

## ADR 002: OCR Engine Selection
**Status:** Accepted
**Context:** We need to extract text and its coordinates from uploaded images.
**Decision:** Use **EasyOCR**.
**Rationale:**
- Supports 80+ languages, including Indonesian.
- High accuracy out of the box.
- Easier installation and setup compared to PaddleOCR.
- Provides bounding box coordinates directly.

## ADR 003: NER Model and Strategy
**Status:** Accepted
**Context:** We need to classify extracted text into PII categories (Name, Email, etc.).
**Decision:** Hybrid approach using **spaCy (IndoNLP model)** and **Regex**.
**Rationale:**
- **Regex**: Most reliable for structured data like Emails, Phone Numbers, and NIK.
- **spaCy**: Efficient and lightweight for Named Entity Recognition (Names, Locations) in Indonesian.
- **Hybrid**: Combining both ensures maximum coverage and accuracy.

## ADR 004: Image Processing Library
**Status:** Accepted
**Context:** We need to apply blur effects to specific regions of an image.
**Decision:** **OpenCV**.
**Rationale:**
- Industry-standard library for computer vision.
- High performance for pixel-level manipulations.
- Easy to implement Gaussian blur on specific ROIs (Regions of Interest).

## ADR 005: Database Selection
**Status:** Accepted
**Context:** We need to store user accounts, image metadata, and processing history.
**Decision:** **PostgreSQL** with **SQLAlchemy (Async)**.
**Rationale:**
- Robust, relational database with strong support for complex queries and JSONB (useful for storing bounding box lists).
- SQLAlchemy provides a powerful ORM; asyncpg enables non-blocking database operations.

## ADR 006: Frontend Framework
**Status:** Accepted
**Context:** We need a responsive and interactive UI for users to review and edit blurs.
**Decision:** **React (with TypeScript and Tailwind CSS)**.
**Rationale:**
- Component-based architecture for manageable UI development.
- TypeScript for type safety and better developer experience.
- Tailwind CSS for rapid and consistent styling.
- Vite for fast build and development cycles.

## ADR 007: Standardized Coordinate Format
**Status:** Accepted
**Context:** Different OCR engines and frontend libraries use different coordinate formats (points, [x,y,w,h], [x1,y1,x2,y2]).
**Decision:** Use **[x, y, w, h]** as the standard API response format.
**Rationale:**
- Most common format for bounding boxes in web development.
- Easy to use with HTML5 Canvas and CSS positioning.
- Simplifies logic for both backend processing and frontend rendering.
