public with sharing class ChatController {

    @AuraEnabled(cacheable=true)
    public static List<Ticket_Message__c> getMessages(string parentId ){
        try{return [SELECT Id, SeenBy__c, CreatedDate,Record_Id_Form__c,Parent_Record_Id__c, DocumentId__c, Name, Message__c, OwnerId, OwnerName__c,Parent_Ticket__c,Owner_URL__c,timelineClassName__c, CloseMsg__c
        FROM Ticket_Message__c WHERE Record_Id_Form__c =:parentId ORDER BY CreatedDate DESC];
        }catch(system.QueryException e){
            return null;
        }
    }
    @AuraEnabled
    public static string createReadStatus(string ticketMessageId, string userId){
        List<Help_Desk_Message_Status__c> seenStatus = [SELECT Id, Ticket_Message__c, OwnerId, UserName__c FROM Help_Desk_Message_Status__c 
        WHERE Ticket_Message__c =:ticketMessageId];
        Set<String> userIds = new Set<String>();
        for(Help_Desk_Message_Status__c u: seenStatus){
            userIds.add(u.OwnerId);
        }
        if(userIds.contains(userId)){
            return null;
        }else{
            Help_Desk_Message_Status__c newStatus = new Help_Desk_Message_Status__c();
            newStatus.OwnerId = userId;
            newStatus.Ticket_Message__c = ticketMessageId;
            newStatus.Read__c = true;

            insert newStatus;
            return newStatus.Id;
        }
    }
    @AuraEnabled
    public static integer getUnseenMessages(string ticketId, string userId){
        integer numberOfUnread = 0;
        List<Ticket_Message__c> messageList = [SELECT Id, SeenBy__c, CreatedDate, DocumentId__c, Name, Message__c, OwnerId, OwnerName__c,Parent_Ticket__c,Owner_URL__c,timelineClassName__c 
        FROM Ticket_Message__c WHERE Parent_Ticket__c =:ticketId];
        Set<Id> messageIds = new Set<Id>();
        for(Ticket_Message__c a: messageList){
            // messageIds.add(a.Id);
            List<Help_Desk_Message_Status__c> seenStatus = [SELECT Id, Ticket_Message__c, OwnerId, UserName__c, Read__c FROM Help_Desk_Message_Status__c 
            WHERE Ticket_Message__c = :a.Id AND OwnerId =:userId];
            if(seenStatus.size() == 0){
                numberOfUnread = numberOfUnread + 1;
            }
        }
        return numberOfUnread;

    }

}
