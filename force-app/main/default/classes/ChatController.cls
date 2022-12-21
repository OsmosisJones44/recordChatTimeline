public with sharing class ChatController {

    // For Infinite Scroll or Pagination
    // Integer offset = (pageNumber - 1) * pageSize;

    @AuraEnabled(cacheable=true)
    public static List<Ticket_Message__c> getMessages(Id parentId ){
        try{return [SELECT Id, SeenBy__c, CreatedDate,Record_Id_Form__c,Parent_Record_Id__c, DocumentId__c, Name, Message__c, OwnerId, OwnerName__c,Parent_Ticket__c,Owner_URL__c,timelineClassName__c, CloseMsg__c
        FROM Ticket_Message__c WHERE Parent_Record_Id__c =:parentId OR Parent_Ticket__c = :parentId ORDER BY CreatedDate DESC];
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
        List<Ticket_Message__c> messageList = [SELECT Id, SeenBy__c, CreatedDate, DocumentId__c, Name,Record_Id_Form__c, Parent_Record_Id__c, Message__c, OwnerId, OwnerName__c,Parent_Ticket__c,Owner_URL__c,timelineClassName__c 
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
    @AuraEnabled(cacheable=true)
    public static Help_Desk_Message_Status__c getUserMsgStatus(string userId, string msgId){
        try{return [SELECT Id, CreatedDate, Name, Ticket_Message__c, OwnerId,Read__c,Liked__c FROM Help_Desk_Message_Status__c WHERE OwnerId = :userId AND Ticket_Message__c = :msgId LIMIT 1];
        }catch(system.QueryException e){
            return null;
        }        
    }

    @AuraEnabled(cacheable=true)
    public static list<Ticket_Message__c> findRecentTicketMessages(string userId){
        try {
            List<Help_Desk_Message_Status__c> msgStatuses = [SELECT Id, CreatedDate, Name, Ticket_Message__c,Ticket_Message__r.Record_Id_Form__c, OwnerId,Read__c,Liked__c FROM Help_Desk_Message_Status__c WHERE OwnerId = :userId ORDER BY CreatedDate DESC];
            Set<Id> parentMsgIds = new Set<Id>();
            Set<Id> ticketMsgs = new Set<Id>();
            for(Help_Desk_Message_Status__c a: msgStatuses){
                if(parentMsgIds.contains(a.Ticket_Message__r.Record_Id_Form__c)){
                    continue;
                } else {
                    parentMsgIds.add(a.Ticket_Message__r.Record_Id_Form__c);
                    ticketMsgs.add(a.Ticket_Message__c);
                }
            }
            List<Ticket_Message__c> recentMsgs = [SELECT Id, SeenBy__c, CreatedDate, DocumentId__c,Record_Id_Form__c, Parent_Record_Id__c, Name, Message__c, OwnerId, OwnerName__c,Parent_Ticket__c,Owner_URL__c,timelineClassName__c, Preview_Name__c
                FROM Ticket_Message__c WHERE Record_Id_Form__c != '' AND Id IN :ticketMsgs ORDER BY CreatedDate DESC];
            return recentMsgs;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    
    
    // // TODO Follow Up Task for Multiple People
    // @AuraEnabled
    // public static void createTask(string subject, string comments, date dueDate, string priority, list<Id> idList){
    //     try {
    //        Task newTask = new Task();
    //        newTask.Subject = subject;
    //        newTask.Subject = subject;
    //        newTask.Subject = subject;
    //        newTask.Subject = subject;
    //        newTask.Subject = subject;
    //        for () {

    //        }
    //     } catch (Exception e) {
    //         throw new AuraHandledException(e.getMessage());
    //     }
    // }

}
