# Blurify AI - Product Requirements Document (PRD)

| Blurify AI PRD | | AI-powered automatic PII masking for digital images. |
| :--- | :--- | :--- |
| **Author**: Gemini CLI | **Status**: Draft | **Created**: May 15, 2026 |

## Introduction
Blurify AI is a web application designed to help users protect their digital privacy by automatically detecting and blurring sensitive information (PII) in images before they are shared online.

## Problem Statement
**Current Process:** Users manually edit images using drawing or blurring tools to hide sensitive data like names, phone numbers, and addresses.
**Primary Users:** Social media users, professionals sharing screenshots, and anyone concerned with digital privacy.
**Pain Points:** Manual censoring is time-consuming, tedious, and prone to human error (missing sensitive spots).
**Importance:** Protecting PII is critical to prevent identity theft, doxxing, and unintended data leaks.

## Objective & Scope
**Objective:** Automate the detection and masking of sensitive information in images using AI.
**Ideal Outcome:** A fast, accurate, and user-friendly tool that requires minimal manual intervention while giving users final control.

### In-scope or Goals
- Automatic PII detection (Name, Email, Phone, Username, NIK, Address).
- Automatic blurring of detected PII.
- Interactive user review and validation (approve/reject/manual blur).
- Secure image processing and temporary storage.
- Downloadable sanitized images.

### Not-in-scope or Non-Goals
- Video blurring.
- Permanent image hosting.
- Advanced image editing (filters, cropping beyond PII masking).

## Product Requirements

### Critical User Journeys (CUJs)
1. **Auto-Masking Flow**: User uploads an image -> AI processes it -> User sees a preview with blurred areas -> User downloads the result.
2. **Interactive Correction Flow**: User uploads an image -> AI misses a piece of data -> User adds a manual blur area -> User downloads the result.
3. **Validation Flow**: User uploads an image -> AI incorrectly blurs a non-sensitive area -> User removes that specific blur -> User downloads the result.

### Functional Requirements

| Priority | Requirement | User Story |
| :--- | :--- | :--- |
| P0 | Image Upload | As a user, I want to upload PNG/JPG images up to 5MB. |
| P0 | OCR Extraction | As a system, I need to extract text and bounding boxes from images. |
| P0 | NER Classification | As a system, I need to identify sensitive entities in the extracted text. |
| P0 | Auto-Blurring | As a user, I want the system to automatically blur detected sensitive areas. |
| P1 | Manual Blur | As a user, I want to manually select additional areas to blur. |
| P1 | Preview & Edit | As a user, I want to review the blurred areas and remove any false positives. |
| P1 | Download | As a user, I want to download the processed image in its original format. |
| P2 | Processing History | As a user, I want to see a history of my recently processed images. |

## Assumptions
- High-quality OCR is essential for reliable NER performance.
- Users have a stable internet connection for uploading/processing.
- Images are primarily in Indonesian or English.

## Risks & Mitigations
- **Risk**: AI misses sensitive data (False Negative). -> **Mitigation**: Allow users to add manual blur areas and emphasize "Review before sharing".
- **Risk**: AI blurs non-sensitive data (False Positive). -> **Mitigation**: Allow users to remove/adjust auto-generated blurs.
- **Risk**: Data Leakage. -> **Mitigation**: Implement TTL (Time-To-Live) for uploaded/processed images; do not store images permanently.

## Business Benefits/Impact/Metrics
- **Success Metrics**: Accuracy of detection (Precision/Recall), Average time to process an image, User retention.
