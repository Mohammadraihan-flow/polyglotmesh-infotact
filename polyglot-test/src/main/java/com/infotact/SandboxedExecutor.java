package com.infotact;
import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.HostAccess;
import org.graalvm.polyglot.PolyglotException;
import org.graalvm.polyglot.ResourceLimits;
import org.graalvm.polyglot.Source;
import org.graalvm.polyglot.proxy.ProxyObject;
import java.io.OutputStream;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.Set;
public class SandboxedExecutor {
	private static final long TIMEOUT_SECONDS = 10;
	private static final Set<String> ALLOWED_LANGUAGES = Set.of("python", "js");
	public static String execute(String lang, String code)
	{
	    if (lang == null || lang.isBlank())
		{
	        return "ERROR: Language cannot be empty.";
	    }
	    String normalizedLang = lang.trim().toLowerCase();
	    if (!ALLOWED_LANGUAGES.contains(normalizedLang))
		{
	        return "ERROR: Unsupported language: " + normalizedLang;
	    }
	    if (code == null || code.isBlank())
		{
	        return "ERROR: Code cannot be empty.";
	    }
	    if (code.length() > 10000)
		{
	        return "ERROR: Code is too large.";
	    }
	    ExecutorService executor = Executors.newSingleThreadExecutor();
	    try {
	        Future<String> future = executor.submit(() -> {
	            ResourceLimits limits = ResourceLimits.newBuilder().statementLimit(10000, null).build();
	            StringBuilder sb = new StringBuilder();
	            OutputStream capture = new OutputStream() {
	                public void write(int b) {
	                    sb.append((char) b);
	                }
	            };
	            try (Context ctx = Context.newBuilder(normalizedLang)
	                    .allowAllAccess(false)
	                    .allowHostAccess(HostAccess.NONE)
	                    .allowIO(false)
	                    .allowCreateThread(false)
	                    .allowNativeAccess(false)
	                    .resourceLimits(limits)
	                    .out(capture)
	                    .build()) {
	                ctx.eval(Source.create(normalizedLang, code));
	            }
					catch (PolyglotException e)
				    {
	                   sb.append("ERROR: ").append(e.getMessage());
	                }
				return sb.toString();
	        });
	        return future.get(TIMEOUT_SECONDS, TimeUnit.SECONDS);
	    }
		catch (TimeoutException e)
		{
	        return "ERROR: Execution timed out after " + TIMEOUT_SECONDS + " seconds.";
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
    public static void testMockMongoToPython() {
        try (Context ctx = Context.newBuilder("python")
                .allowAllAccess(false)
                .allowHostAccess(HostAccess.NONE)
                .allowIO(false)
                .allowCreateThread(false)
                .allowNativeAccess(false)
                .build())
        {
        	List<Map<String, Object>> products = MockMongoData.getProductData();
        	Map<String, Object> laptop = products.get(0);
        	Map<String, Object> phone = products.get(1);
            ProxyObject laptopData = ProxyObject.fromMap(laptop);
            ProxyObject phoneData = ProxyObject.fromMap(phone);
            ctx.getBindings("python").putMember("laptop", laptopData);
            ctx.getBindings("python").putMember("phone", phoneData);
            var result = ctx.eval("python", "laptop_total = laptop.price * laptop.quantity\n"
                    + "phone_total = phone.price * phone.quantity\n"
                    + "total = laptop_total + phone_total\n"
                    + "discount = total * 0.10\n"
                    + "total - discount"
            );
            System.out.println("Python calculated discounted total: " + result);
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
        testMockMongoToPython();
    }
}
