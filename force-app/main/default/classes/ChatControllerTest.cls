@IsTest
public with sharing class ChatControllerTest {
    @isTest
    static void findAccounts2() {
         BirthdayControllerTest.createAccounts(10);
         string userId = UserInfo.getUserId();
		string userIdNot = [SELECT Id FROM User WHERE IsActive = true AND Id != :userId][0].Id;
        
       RecordType personAccountRecordType =  [SELECT Id FROM RecordType WHERE Name = 'Person Account' and SObjectType = 'Account'];

                
        Account primOwn = new Account();
        primOwn.AccountSource = 'Unknown';
        primOwn.FirstName = 'Test';
        primOwn.LastName = 'TestLast';
        primOwn.RecordTypeId = personAccountRecordType.Id;
        
        insert primOwn;
        Account primOwnQ = [SELECT Id, PersonContactId FROM Account WHERE Id = :primOwn.Id];
        
        Account secOwn = new Account();
        secOwn.AccountSource = 'Unknown';
        secOwn.FirstName = 'Test2';
        secOwn.LastName = 'TestLast2';
        secOwn.RecordTypeId = personAccountRecordType.Id;
        
        insert secOwn;        
        
        Account household = new Account();
        household.Primary_Contact__c = primOwnQ.id;
        household.Name = 'TestName2';
        household.OwnerId = userId;
        household.CSA__c = userId;
        insert household;
        
        Account household2 = new Account();
        household2.Primary_Contact__c = primOwnQ.id;
        household2.Secondary_Contact__c = secOwn.id;
        household2.Name = 'TestName';
        household2.OwnerId = userId;
        household2.CSA__c = userId;
        insert household2;
        
        secOwn.Household__pc = household.Id;
        update secOwn;
        primOwn.Household__pc = household.Id;
        update primOwn;
        
        New_Account_Setup__c newSetup = new New_Account_Setup__c();
        newSetup.Name = 'Test Ticket';
        newSetup.OwnerId = userId;

        insert newSetup;
        Case theCase = new Case();
        theCase.Return_Name__c = 'Test Ticket';
        theCase.OwnerId = userId;
        theCase.AccountId = household.Id;

        insert theCase;
        Opportunity opp = new Opportunity();
        opp.Name = 'Test Ticket';
        opp.OwnerId = userId;
        opp.AccountId = household.Id;
        opp.PrimaryContact__c = primOwnQ.PersonContactId;
        opp.StageName = 'New';
        opp.CloseDate = Date.today();

        insert opp;
        Lead leadVal = new Lead();
        leadVal.FirstName = 'Test';
        leadVal.LastName = 'Ticket';
        leadVal.Company = 'Test Ticket';
        leadVal.Email = 'name@email.com';
        leadVal.LeadSource = 'Unknown';
        leadVal.OwnerId = userId;
        leadVal.CSA_Lookup__c = userId;

        insert leadVal;
        
        FinServ__FinancialAccount__c newAcct = new FinServ__FinancialAccount__c();
        newAcct.Name = 'Test Ticket';
        newAcct.FinServ__PrimaryOwner__c = primOwnQ.Id;
        newAcct.OwnerId = userId;

        insert newAcct;
        Raise_Cash_Request__c cashReq = new Raise_Cash_Request__c();
        cashReq.Financial_Account__c = newAcct.Id;
        cashReq.Account__c = household.Id;

        insert cashReq;
        TRPG_Help_Desk__c newTicket = new TRPG_Help_Desk__c();
        newTicket.Name = 'Test Ticket';
        newTicket.OwnerId = userId;
        newTicket.Priority__c = 'Low';
        newTicket.Request_Status__c = 'Submitted';

        insert newTicket;
        User_Ticket_Relationship__c rel = new User_Ticket_Relationship__c();
        rel.User__c = userId;
        rel.Ticket__c = newTicket.Id;

        Ticket_Message__c newMessage = new Ticket_Message__c();
        newMessage.Parent_Ticket__c = newTicket.Id;
        newMessage.OwnerId = userId;

        insert newMessage;
        
        Ticket_Message__c newMessage2 = new Ticket_Message__c();
        newMessage2.Parent_Ticket__c = newTicket.Id;
        newMessage2.OwnerId = userIdNot;

        insert newMessage2;

        Help_Desk_Message_Status__c newStatus = new Help_Desk_Message_Status__c();
        newStatus.OwnerId = userIdNot;
        newStatus.Read__c = true;
        newStatus.Ticket_Message__c = newMessage.Id;
        
        insert newStatus;
        Help_Desk_Message_Status__c newStatus2 = new Help_Desk_Message_Status__c();
        newStatus2.OwnerId = userId;
        newStatus2.Read__c = true;
        newStatus2.Ticket_Message__c = newMessage2.Id;
        
        insert newStatus2;
        Ticket_Message__c newMessage3 = new Ticket_Message__c();
        newMessage3.OwnerId = userIdNot;
        newMessage3.Message__c = 'true';

        insert newMessage3;
        Ticket_Message__c newMessage4 = new Ticket_Message__c();
        newMessage4.OwnerId = userId;
        newMessage4.Message__c = 'true';

        insert newMessage4;
        Help_Desk_Message_Status__c hdms = new Help_Desk_Message_Status__c();
        hdms.OwnerId = userId;
        hdms.Ticket_Message__c = newMessage.Id;
        hdms.Read__c = true;
        insert hdms;
        
        Help_Desk_Message_Status__c newStatus33 = new Help_Desk_Message_Status__c();
        newStatus33.OwnerId = userId;
        newStatus33.Ticket_Message__c = newMessage2.Id;
        newStatus33.Read__c = false;
        insert newStatus33;
        
        Test.startTest();
        List<Ticket_Message__c> cont = ChatController.getMessages(newTicket.Id);
        List<Ticket_Message__c> cont2 = ChatController.getPinnedMessages(newTicket.Id);
        List<Ticket_Message__c> cont11 = ChatController.getRecentThreadMsg(newTicket.Id);
        List<Ticket_Message__c> recentThreads = ChatController.findRecordThreadTicketMessages(newTicket.Id);
        List<Ticket_Message__c> recentThreads2 = ChatController.findRecentBookmarkedTicketMessages(userId);
        Integer numthreads = ChatController.getNumberOfRecordOpenThreads(userId);
        Ticket_Message__c ticketMessage = ChatController.getTicketMessage(newMessage.Id);
        string conts44 = ChatController.markAllRead(userId);
        string conts3 = ChatController.createReadStatus(newMessage.Id ,userId);
        string conts4 = ChatController.createReadStatus(newMessage2.Id ,userIdNot);
        string conts5 = ChatController.deleteMessageStatus(newStatus2.Id);
        // string conts6 = ChatController.deleteMessageStatus(newTicket.Id);
        Help_Desk_Message_Status__c conts7 = ChatController.getUserMsgStatus(userId,newMessage.Id);
        list<Help_Desk_Message_Status__c> conts8 = ChatController.findRecentTicketMessages(userId);
        list<Help_Desk_Message_Status__c> conts9 = ChatController.findRecentOpenTicketMessages(userId);
        list<Help_Desk_Message_Status__c> conts10 = ChatController.findRecentOpenThreadTicketMessages(userId);
        list<Help_Desk_Message_Status__c> conts11 = ChatController.findRecentThreadTicketMessages(userId);
        list<Help_Desk_Message_Status__c> conts12 = ChatController.findRecentRecordThreadTicketMessages(userId,newTicket.Id);
        Test.stopTest();
    }
}