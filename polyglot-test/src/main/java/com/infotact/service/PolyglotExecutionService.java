package com.infotact.service;
import com.infotact.ExecutionRequest;
import com.infotact.ExecutionResponse;
import com.infotact.SandboxedExecutor;
public class PolyglotExecutionService
{
	public static void main(String[] args)
	{

	    PolyglotExecutionService service = new PolyglotExecutionService();
	    ExecutionRequest request =new ExecutionRequest("python", "print('Hello from Service')");
	    ExecutionResponse response = service.execute(request);
	    System.out.println("Success: " + response.isSuccess());
	    System.out.println("Output: " + response.getOutput());
	}
    public ExecutionResponse execute(ExecutionRequest request)
    {
        if (request == null)
        {
            return new ExecutionResponse(false, "ERROR: Request cannot be null.");
        }
        String output = SandboxedExecutor.execute(request.getLang(), request.getCode());
        boolean success = !output.startsWith("ERROR:");
        return new ExecutionResponse(success, output);
    }
}