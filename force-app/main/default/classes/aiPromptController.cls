public with sharing class aiPromptController {

    @AuraEnabled(cacheable=true)
    public static String getInsights(String formula, string context, string command) {
        OpenAI_Info__mdt integration = OpenAI_Info__mdt.getInstance('Completions_Endpoint');

        if (integration == null) {
            return 'Error: ChatGPTIntegration configuration not found';
        }     
        Http http = new Http();
        HttpRequest request = new HttpRequest();
        HttpResponse response;
        
        request.setEndpoint(integration.Endpoint__c);
        request.setMethod('POST');
        request.setHeader('Content-Type', 'application/json');
        request.setHeader('Authorization', 'Bearer ' + integration.API_Key__c);
        // Set maximum timeout
        request.setTimeout(120000);

        String content = context +' '
                         + String.escapeSingleQuotes(formula)+' '
                         + command;


        String payload = '{"model": "'+integration.Model__c
                            +'", "max_tokens": '+ integration.Max_Tokens__c
                            +', "messages": [{"role": "user", "content": "' 
                            + content + '"}]}';
        request.setBody(payload);

        try {
            response = http.send(request);
            if (response.getStatusCode() == 200) {
                return response.getBody();
            } else {
                return 'Error: ' + response.getStatus();
            }
        } catch (Exception e) {
            return 'Error: ' + e.getMessage();
        }
    }
}