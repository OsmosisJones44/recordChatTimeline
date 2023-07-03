@isTest
public with sharing class aiPromptControllerTest {
    @isTest
    static void testGetInsights() {
        // Set up the mock for the API call
        Test.setMock(HttpCalloutMock.class, new aiPromptControllerMock());

        Test.startTest();

        // Call the getInsights method with a sample message
        String formula = 'IF ( ( CHANNEL_ORDERS__Renewal_Date__c - TODAY () ) <= 45 && ( ( CHANNEL_ORDERS__Renewal_Date__c - TODAY () ) > 0 ), IMAGE ("/resource/CHANNEL_ORDERS__uilib/images/warning_60_yellow.png", "warning", 16, 16) & \' Ends in \' & TEXT ( CHANNEL_ORDERS__Renewal_Date__c - TODAY ()) & \' Days\', null)';
        String context = 'You are a sales rep in the Channel Orders team. You are looking at a list of opportunities. You want to know which opportunities are expiring soon.';
        String command = 'tldr';
        String insights = aiPromptController.getInsights(formula, context, command);

        Test.stopTest();

        // Assert that the insights are not empty or an error message
        System.assertNotEquals(null, insights, 'Insights should not be null');
        System.assert(insights.length() > 0, 'Insights should not be empty');
        System.assert(!insights.startsWith('Error:'), 'Insights should not start with "Error:"');
    }
}