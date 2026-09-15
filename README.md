# PolyglotMesh

### GraalVM Multi-Language Runtime Sandbox

PolyglotMesh is a multi-language code execution platform built using
**Spring Boot and GraalVM Polyglot**.

The project provides a common execution API for running supported guest
languages such as **Python and JavaScript** while applying controlled
execution restrictions to reduce direct access to the host environment.

---

## 🚀 Project Overview

Modern applications sometimes need to execute code written in different
programming languages.

Running user-provided code directly on the host system can introduce
security and resource-management risks.

PolyglotMesh addresses this problem by providing a controlled runtime
environment using **GraalVM Polyglot Contexts**.

The platform allows users to:

- Write code using an IDE-like editor
- Select a supported programming language
- Submit code to the backend
- Execute the code through GraalVM
- Receive execution output or errors
- Execute Python and JavaScript through a common API
- Apply host-access and I/O restrictions
- Demonstrate interoperability between Java and Python

---

## 🎯 Objectives

The main objectives of PolyglotMesh are:

1. Build a multi-language execution environment.
2. Integrate GraalVM Polyglot with Spring Boot.
3. Provide a common REST API for code execution.
4. Restrict guest-language access to the host environment.
5. Demonstrate Java-to-Python interoperability.
6. Explore malicious and continuously running code scenarios.
7. Configure the application for GraalVM Native Image.
8. Provide an IDE-like development experience using Monaco Editor.

---

## 🏗️ System Architecture

```text
                   ┌─────────────────────────┐
                   │      React Frontend     │
                   │                         │
                   │     Monaco Editor       │
                   └────────────┬────────────┘
                                │
                                │ REST API
                                ▼
                   ┌─────────────────────────┐
                   │    Spring Boot Backend  │
                   │                         │
                   │    Execution API        │
                   └────────────┬────────────┘
                                │
                                ▼
                   ┌─────────────────────────┐
                   │   GraalVM Polyglot       │
                   │       Context            │
                   │                         │
                   │  Host Access: Disabled  │
                   │  I/O Access: Disabled   │
                   └────────────┬────────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
             ┌─────────────┐         ┌─────────────┐
             │   Python    │         │ JavaScript  │
             └─────────────┘         └─────────────┘
                    │                       │
                    └───────────┬───────────┘
                                ▼
                         Execution Result
                                │
                                ▼
                         React Frontend
