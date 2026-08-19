package com.infotact;
import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.HostAccess;
import org.graalvm.polyglot.PolyglotException;
import org.graalvm.polyglot.ResourceLimits;
import org.graalvm.polyglot.Source;
import java.io.OutputStream;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
public class SandboxedExecutor {
	private static final long TIMEOUT_SECONDS = 10;
    public static String execute(String lang, String code)
    {
    	    ExecutorService executor = Executors.newSingleThreadExecutor();
    	    try {
    	    	    Future<String> future = executor.submit(()->{
    	    	    	 ResourceLimits limits = ResourceLimits.newBuilder().statementLimit(10000, null).build();
    		        StringBuilder sb = new StringBuilder();
                OutputStream capture = new OutputStream() {
                    public void write(int b) {
                        sb.append((char) b);
                    }
                };
                try (Context ctx = Context.newBuilder(lang)
                .allowAllAccess(false)
                .allowHostAccess(HostAccess.NONE)
                .allowIO(false)
                .allowCreateThread(false)
                .allowNativeAccess(false)
                .resourceLimits(limits)
                .out(capture)
                .build()) {
                      ctx.eval(Source.create(lang, code));
                 }
                 catch (PolyglotException e) {
                     sb.append("ERROR: ").append(e.getMessage());
                 }
                 return sb.toString();
             });
    		  return future.get(TIMEOUT_SECONDS,TimeUnit.SECONDS);
    	    }
    	    catch (TimeoutException e) {
    	        return "ERROR: Execution timed out after "+ TIMEOUT_SECONDS + " seconds.";
    	    } 
    	    catch (InterruptedException e) 
    	    {
    	        Thread.currentThread().interrupt();
    	        return "ERROR: Execution interrupted.";

    	    }
    	    catch (Exception e)
    	    {
    	        return "ERROR: " + e.getMessage();
    	    }
    	    finally {
    	        executor.shutdownNow();
    	    }
    	}
    public static void main(String[] args) {
        System.out.println(execute("python", "print('Sandboxed Python running')"));
        System.out.println(execute("js", "console.log('Sandboxed JS running')"));
        System.out.println(execute("python", "open('C:/test.txt', 'w')"));
        System.out.println(execute("python", "while True: pass"));
    }

}