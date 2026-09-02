---
name: api-design-principles
description: Enforces clean API contract design, consistent data modeling, strict TypeScript interfaces, RESTful/GraphQL conventions, and Firestore document schemas.
---

# API Design Principles

Guidelines and best practices for creating scalable, maintainable, and type-safe API contracts and database schemas.

## Design Rules
1. **Schema & Model Consistency**: Every model interface in `src/types/` must clearly specify optionality, primitive types, and enum values.
2. **Predictable Data Types**: Use ISO 8601 strings for timestamps (`createdAt`, `updatedAt`), standard numeric types for quantities/coordinates, and immutable unique identifiers.
3. **Backward Compatibility**: Never make breaking changes to client payload structures without fallback defaults or migration bridges.
4. **Validation & Security**: Validate all incoming mutations at boundary layers to prevent malformed data or price tampering.
