package com.infotact.backend;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.Test;

class ExecutionControllerTest {

    private final ExecutionController controller = new ExecutionController();

    @Test
    void shouldRejectEmptyCode() {

        ExecutionRequest request = new ExecutionRequest();
        request.setLanguage("python");
        request.setCode("");

        ExecutionResponse response = controller.execute(request);

        assertNull(response.getOutput());
        assertEquals("Code cannot be empty", response.getError());
    }

    @Test
    void shouldRejectUnsupportedLanguage() {

        ExecutionRequest request = new ExecutionRequest();
        request.setLanguage("ruby");
        request.setCode("puts 10");

        ExecutionResponse response = controller.execute(request);

        assertNull(response.getOutput());
        assertEquals("Unsupported language: ruby", response.getError());
    }

    @Test
    void shouldExecutePythonCode() {

        ExecutionRequest request = new ExecutionRequest();
        request.setLanguage("python");
        request.setCode("print(10 + 20)");

        ExecutionResponse response = controller.execute(request);

        assertEquals("30\n", response.getOutput());
        assertNull(response.getError());
    }

    @Test
    void shouldExecuteJavaScriptCode() {

        ExecutionRequest request = new ExecutionRequest();
        request.setLanguage("js");
        request.setCode("print(10 + 20)");

        ExecutionResponse response = controller.execute(request);

        assertEquals("30\n", response.getOutput());
        assertNull(response.getError());
    }
}