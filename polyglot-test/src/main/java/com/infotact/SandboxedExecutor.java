package com.infotact;
import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.HostAccess;
import org.graalvm.polyglot.PolyglotException;
import org.graalvm.polyglot.ResourceLimits;
import org.graalvm.polyglot.Source;
import org.graalvm.polyglot.proxy.ProxyObject;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.Map;
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
    	    finally
    	    {
    	        executor.shutdownNow();
    	    }
    	}
    public static void testJavaToPython() {

        try (Context ctx = Context.newBuilder("python")
                .allowAllAccess(false)
                .allowHostAccess(HostAccess.NONE)
                .allowIO(false)
                .allowCreateThread(false)
                .allowNativeAccess(false)
                .build())
        {

            Map<String, Object> data = new HashMap<>();
            data.put("price", 50000);
            data.put("quantity", 2);
            ProxyObject proxyData = ProxyObject.fromMap(data);
            ctx.getBindings("python").putMember("data", proxyData);
            var result = ctx.eval("python","data.price * data.quantity");
            System.out.println("Python calculated total: " + result);
        }
        catch (Exception e)
        {
            System.out.println("ERROR: " + e.getMessage());
        }
    }
    public static void main(String[] args)
    {
        System.out.println(execute("python", "print('Sandboxed Python running')"));
        System.out.println(execute("js", "console.log('Sandboxed JS running')"));
        System.out.println(execute("python", "open('C:/test.txt', 'w')"));
//      System.out.println(execute("python", "while True: pass"));
//      System.out.println(execute("python", "import urllib.request; urllib.request.urlopen('https://example.com')"));
//      System.out.println(execute("python", "import socket; socket.create_connection(('example.com', 443), 3)"));
//      System.out.println(execute("python", "while True: pass"));
        testJavaToPython();
//      System.out.println(execute("python", "x = [0] * 10000000")	);
//      System.out.println(execute("python", "x = [0] * 10000000; print(len(x))"));
//      System.out.println(execute("python", "raise Exception('Malicious code test')"));
        System.out.println(execute("js", "throw new Error('JavaScript error test')"));
    }
}