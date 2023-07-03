@isTest
global with sharing class aiPromptControllerMock {
    global HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        res.setStatusCode(200);

        res.setBody('{"id": "chatcmpl-abcdefg123456", "object": "chat.completion", "created": 1681152783, "model": "gpt-3.5-turbo-0301", "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}, "choices": [{"index": 0, "message": {"role": "assistant", "content": "This is a mock response from the ChatGPT API."}, "finish_reason": "stop"}]}');
        return res;
    }
}