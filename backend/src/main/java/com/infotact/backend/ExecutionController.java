package com.infotact.backend;

import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.util.Set;

import org.graalvm.polyglot.Context;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ExecutionController {

    private static final Set<String> SUPPORTED_LANGUAGES = Set.of(
            "python",
            "js"
    );

    @PostMapping("/execute")
    public ExecutionResponse execute(@RequestBody ExecutionRequest request) {

        String language = request.getLanguage();

if (request.getCode() == null || request.getCode().isBlank()) {
    return new ExecutionResponse(
            null,
            "Code cannot be empty"
    );
}

if (language == null || !SUPPORTED_LANGUAGES.contains(language)) {
            return new ExecutionResponse(
                    null,
                    "Unsupported language: " + language
            );
        }

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        try (Context context = Context.newBuilder(language)
                .allowHostAccess(false)
                .allowIO(false)
                .out(new PrintStream(outputStream))
                .build()) {

            context.eval(
                    language,
                    request.getCode()
            );

            return new ExecutionResponse(
                    outputStream.toString(),
                    null
            );

        } catch (Exception e) {

            return new ExecutionResponse(
                    outputStream.toString(),
                    e.getMessage()
            );
        }
    }
}