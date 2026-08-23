package com.infotact;
import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.HostAccess;
public class PolyglotTest {
    public static void main(String[] args)
    {
        executePython();
        executeJavaScript();
    }
    static void executePython()
    {
        try (Context context = Context.newBuilder("python")
                .allowAllAccess(false)
                .allowHostAccess(HostAccess.NONE)
                .allowIO(false)
                .allowCreateThread(false)
                .allowNativeAccess(false)
                .build()) {
            context.eval("python", "print('Hello from Python!')");
        }
        catch (Exception e)
        {
            System.out.println("Python error: " + e.getMessage());
        }
    }
    static void executeJavaScript()
    {
        try (Context context = Context.newBuilder("js")
                .allowAllAccess(false)
                .allowHostAccess(HostAccess.NONE)
                .allowIO(false)
                .allowCreateThread(false)
                .allowNativeAccess(false)
                .build()) {
            context.eval("js", "console.log('Hello from JavaScript!')");
        }
        catch (Exception e)
        {
            System.out.println("JavaScript error: " + e.getMessage());
        }
    }
}