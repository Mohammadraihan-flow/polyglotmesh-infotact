package com.infotact.backend;

public class ExecutionResponse {

    private String output;
    private String error;

    public ExecutionResponse(String output, String error) {
        this.output = output;
        this.error = error;
    }

    public String getOutput() {
        return output;
    }

    public String getError() {
        return error;
    }
}