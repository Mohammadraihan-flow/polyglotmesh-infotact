# PolyglotMesh

### GraalVM Multi-Language Runtime Sandbox

PolyglotMesh is a multi-language code execution platform built using
Spring Boot and GraalVM Polyglot.

## Features

- Python and JavaScript code execution
- Spring Boot REST API
- GraalVM Polyglot Context
- Host access restriction
- I/O restriction
- Java-Python interoperability
- React + Monaco Editor
- GraalVM Native Image configuration

## Architecture

React + Monaco Editor  
↓  
Spring Boot REST API  
↓  
GraalVM Polyglot Context  
↓  
Python / JavaScript  
↓  
Execution Result

## Technologies

- Java 21
- Spring Boot
- GraalVM
- Python
- JavaScript
- React
- Monaco Editor
- Maven
- Git & GitHub

## API

### Execute Code

`POST /api/execute`

Example:

```json
{
  "language": "python",
  "code": "print('Hello from PolyglotMesh')"
}