@IsTest
public with sharing class ChatControllerTest {
    @isTest
    static void findAccounts2() {
        BirthdayControllerTest.createAccounts(10);
        Ticket_Message__c newStatus = new Ticket_Message__c();
        newStatus.OwnerId = '0052E00000JfpsNQAR';
        newStatus.Message__c = 'true';

        insert newStatus;
        Ticket_Message__c newStatus3 = new Ticket_Message__c();
        newStatus3.OwnerId = '0052E00000JfpsNQAR';
        newStatus3.Message__c = 'true';

        insert newStatus3;
        Help_Desk_Message_Status__c newStatus2 = new Help_Desk_Message_Status__c();
        newStatus2.OwnerId = '0052E00000JfpsNQAR';
        newStatus2.Ticket_Message__c = newstatus.Id;
        newStatus2.Read__c = true;
        insert newStatus2;
        
        Test.startTest();
        List<Ticket_Message__c> conts = ChatController.getMessages('');
        List<Ticket_Message__c> conts2 = ChatController.getPinnedMessages('');
        string conts3 = ChatController.createReadStatus(newStatus.Id ,'0052E00000JfpsNQAR');
        string conts4 = ChatController.createReadStatus(newStatus3.Id ,'0052E00000JfpsNQAR');
        Help_Desk_Message_Status__c conts5 = ChatController.getUserMsgStatus('0052E00000JfpsNQAR','');
        list<Help_Desk_Message_Status__c> conts6 = ChatController.findRecentTicketMessages('0052E00000JfpsNQAR');
        list<Help_Desk_Message_Status__c> conts8 = ChatController.findRecentOpenTicketMessages('0052E00000JfpsNQAR');
        Test.stopTest();
    }
}