package com.infotact;
public class ExecutionResponse
{
    private boolean success;
    private String output;
    public ExecutionResponse()
    {
    	
    }
    public ExecutionResponse(boolean success, String output)
    {
        this.success = success;
        this.output = output;
    }
    public boolean isSuccess()
    {
        return success;
    }

    public void setSuccess(boolean success)
    {
        this.success = success;
    }

    public String getOutput()
    {
        return output;
    }
    public void setOutput(String output)
    {
        this.output = output;
    }
}