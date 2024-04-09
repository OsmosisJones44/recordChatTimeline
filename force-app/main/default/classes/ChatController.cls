public with sharing class ChatController {

    // For Infinite Scroll or Pagination
    // Integer offset = (pageNumber - 1) * pageSize;

    @AuraEnabled
    public static List<Ticket_Message__c> getMessages(string parentId ){
            return [SELECT Id, SeenBy__c, Thread__c, Icon_Name__c,CreatedDate,Record_Id_Form__c, Preview__c,Parent_Record_Id__c, DocumentId__c, Name, Message__c, OwnerId, OwnerName__c,Parent_Ticket__c,Owner_URL__c,timelineClassName__c, CloseMsg__c, Pinned__c, Closed_Thread__c
        FROM Ticket_Message__c WHERE Parent_Record_Id__c =:parentId OR Parent_Ticket__c = :parentId WITH SECURITY_ENFORCED ORDER BY CreatedDate DESC];
    }
    @AuraEnabled(cacheable=true)
    public static List<Ticket_Message__c> getPinnedMessages(string parentId){
            return [SELECT Id, SeenBy__c, CreatedDate,Record_Id_Form__c, Preview__c,Parent_Record_Id__c, DocumentId__c, Name, Message__c, OwnerId, OwnerName__c,Parent_Ticket__c,Owner_URL__c,timelineClassName__c, CloseMsg__c, Pinned__c
        FROM Ticket_Message__c WHERE Pinned__c = true AND (Parent_Record_Id__c =:parentId OR Parent_Ticket__c = :parentId) ORDER BY CreatedDate DESC];
    }  
    @AuraEnabled(cacheable=true)
    public static Ticket_Message__c getTicketMessage(string ticketMessageId){
        return [SELECT Id, SeenBy__c, CreatedDate,Record_Id_Form__c, Preview__c,Parent_Record_Id__c, DocumentId__c, Name, Message__c, OwnerId, OwnerName__c,Parent_Ticket__c,Owner_URL__c,timelineClassName__c, CloseMsg__c, Pinned__c, Icon_Name__c, Closed_Thread__c FROM Ticket_Message__c WHERE Id =:ticketMessageId];
    }
    @AuraEnabled
    public static string createReadStatus(string ticketMessageId, string userId){
        List<Help_Desk_Message_Status__c> seenStatus = [SELECT Id, Ticket_Message__c, Ticket_Message__r.OwnerId, OwnerId, UserName__c FROM Help_Desk_Message_Status__c 
        WHERE Ticket_Message__c =:ticketMessageId];
        Set<String> userIds = new Set<String>();
        for(Help_Desk_Message_Status__c u: seenStatus){
            userIds.add(u.OwnerId);
        }
        if(userIds.contains(userId)){
            List<Help_Desk_Message_Status__c> foundStatus = [SELECT Id, Ticket_Message__c, OwnerId, UserName__c, Read__c, CreatedDate FROM Help_Desk_Message_Status__c WHERE Ticket_Message__c =:ticketMessageId AND OwnerId =:userId ORDER BY CreatedDate DESC];
            for(Help_Desk_Message_Status__c a: foundStatus){
                if(a.Read__c){
                    continue;
                }else{
                    a.Read__c = true;
                }
            }
            update foundStatus;
            return null;
        }
        else{
            string msgOwner = [SELECT Id, OwnerId FROM Ticket_Message__c WHERE Id =:ticketMessageId].OwnerId;
            if (userId == msgOwner) {
                Help_Desk_Message_Status__c newStatus = new Help_Desk_Message_Status__c();
                newStatus.OwnerId = userId;
                newStatus.Ticket_Message__c = ticketMessageId;
                newStatus.Read__c = true;
    
                insert newStatus;
                return newStatus.Id;
            } else {
                return null;
            }
        }
    }
    @AuraEnabled
    public static Help_Desk_Message_Status__c getUserMsgStatus(string userId, string msgId){
        return [SELECT Id, CreatedDate, Name, Ticket_Message__c, OwnerId,Read__c,Liked__c, Pinned__c,Bookmarked__c FROM Help_Desk_Message_Status__c WHERE OwnerId = :userId AND Ticket_Message__c = :msgId WITH SECURITY_ENFORCED LIMIT 1];       
    }
    @AuraEnabled
    public static List<Ticket_Message__c> getRecentThreadMsg(string msgId){
        return [SELECT Id, SeenBy__c, CreatedDate,Preview__c, DocumentId__c,Record_Id_Form__c, Parent_Record_Id__c, Name, Message__c, OwnerId, OwnerName__c,Parent_Ticket__c,Owner_URL__c,timelineClassName__c, Preview_Name__c, Parent_Ticket_Message__c
         FROM Ticket_Message__c WHERE Parent_Ticket_Message__c = :msgId WITH SECURITY_ENFORCED ORDER BY CreatedDate DESC];     
    }
    @AuraEnabled(cacheable=true)
    public static list<Help_Desk_Message_Status__c> findRecentTicketMessages(string userId){
        List<Help_Desk_Message_Status__c> msgStatuses = [SELECT Id, Ticket_Message__r.Message__c,Ticket_Message__r.Message_Source__c, Ticket_Message__r.Id, Ticket_Message__r.CreatedDate,Ticket_Message__r.DocumentId__c,Ticket_Message__r.OwnerName__c, Ticket_Message__r.Owner_URL__c, CreatedDate, Name, Ticket_Message__c,Ticket_Message__r.Record_Id_Form__c, OwnerId,Read__c,Liked__c FROM Help_Desk_Message_Status__c WHERE OwnerId = :userId AND Ticket_Message__r.Message_Source__c != 'Message Thread' ORDER BY CreatedDate DESC];
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
        List<Ticket_Message__c> recentMsgs = [SELECT Id, SeenBy__c, CreatedDate,Preview__c, DocumentId__c,Record_Id_Form__c, Parent_Record_Id__c, Name, Message__c, OwnerId, OwnerName__c,Parent_Ticket__c,Owner_URL__c,timelineClassName__c, Preview_Name__c
        FROM Ticket_Message__c WHERE Record_Id_Form__c != '' AND Id IN :ticketMsgs ORDER BY CreatedDate DESC]; 
        List<Help_Desk_Message_Status__c> msgStatuses2 = [SELECT Id, Search_Formula__c, tableTimelineClass__c,Ticket_Message__r.OwnerId, Ticket_Message__r.Message__c,Ticket_Message__r.Preview__c, Ticket_Message__r.Id, Ticket_Message__r.CreatedDate,Ticket_Message__r.DocumentId__c,Ticket_Message__r.OwnerName__c, Ticket_Message__r.Owner_URL__c,Ticket_Message__r.Icon_Name__c, CreatedDate, Name, Ticket_Message__c,Ticket_Message__r.Record_Id_Form__c,Ticket_Message__r.Parent_Record_Id__c,Ticket_Message__r.Message_Source__c, OwnerId,Read__c,Liked__c FROM Help_Desk_Message_Status__c WHERE OwnerId = :userId AND Ticket_Message__c IN: recentMsgs ORDER BY CreatedDate DESC];
        return msgStatuses2;
    }
    @AuraEnabled(cacheable=true)
    public static list<Help_Desk_Message_Status__c> findRecentOpenTicketMessages(string userId){
        List<Help_Desk_Message_Status__c> msgStatuses = [SELECT Id, Ticket_Message__r.Message__c,Ticket_Message__r.Message_Source__c, Ticket_Message__r.Id, Ticket_Message__r.CreatedDate,Ticket_Message__r.DocumentId__c,Ticket_Message__r.OwnerName__c, Ticket_Message__r.Owner_URL__c, CreatedDate, Name, Ticket_Message__c,Ticket_Message__r.Record_Id_Form__c,Ticket_Message__r.Parent_Record_Id__c,  OwnerId,Read__c,Liked__c FROM Help_Desk_Message_Status__c WHERE OwnerId = :userId AND Read__c = false AND Ticket_Message__r.Message_Source__c != 'Message Thread' ORDER BY CreatedDate DESC];
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
        List<Ticket_Message__c> recentMsgs = [SELECT Id, SeenBy__c, CreatedDate,Preview__c, DocumentId__c,Record_Id_Form__c, Parent_Record_Id__c, Name, Message__c, OwnerId, OwnerName__c,Parent_Ticket__c,Owner_URL__c,timelineClassName__c, Preview_Name__c
        FROM Ticket_Message__c WHERE Record_Id_Form__c != '' AND Id IN :ticketMsgs ORDER BY CreatedDate DESC];
        List<Help_Desk_Message_Status__c> msgStatuses2 = [SELECT Id, Search_Formula__c,tableTimelineClass__c,Ticket_Message__r.Parent_Record_Id__c,Ticket_Message__r.OwnerId, Ticket_Message__r.Message__c,Ticket_Message__r.Preview__c, Ticket_Message__r.Id, Ticket_Message__r.CreatedDate,Ticket_Message__r.Message_Source__c,Ticket_Message__r.DocumentId__c,Ticket_Message__r.OwnerName__c,Ticket_Message__r.Icon_Name__c, Ticket_Message__r.Owner_URL__c, CreatedDate, Name, Ticket_Message__c,Ticket_Message__r.Record_Id_Form__c,OwnerId,Read__c,Liked__c FROM Help_Desk_Message_Status__c WHERE OwnerId = :userId AND Read__c = false AND Ticket_Message__c IN: recentMsgs ORDER BY CreatedDate DESC];
        return msgStatuses2;
    }    
    @AuraEnabled(cacheable=true)
    public static list<Help_Desk_Message_Status__c> findRecentOpenThreadTicketMessages(string userId){
        // id recordId_Val = recordId;
        // string recordString = recordId_Val;
        List<Help_Desk_Message_Status__c> msgStatuses = [SELECT Id, Ticket_Message__r.Message__c, Ticket_Message__r.Id, Ticket_Message__r.CreatedDate,Ticket_Message__r.DocumentId__c,Ticket_Message__r.OwnerName__c,Ticket_Message__r.Thread__c, Ticket_Message__r.Owner_URL__c,Ticket_Message__r.Message_Source__c, CreatedDate, Name, Ticket_Message__c,Ticket_Message__r.Record_Id_Form__c,Ticket_Message__r.Icon_Name__c,Ticket_Message__r.Parent_Record_Id__c, OwnerId,Read__c,Liked__c FROM Help_Desk_Message_Status__c WHERE OwnerId = :userId AND Ticket_Message__r.Message_Source__c = 'Message Thread' AND Read__c = false ORDER BY CreatedDate DESC];
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
        List<Ticket_Message__c> recentMsgs = [SELECT Id, SeenBy__c,Thread__c, CreatedDate,Preview__c, DocumentId__c,Record_Id_Form__c, Parent_Record_Id__c, Name, Message__c, OwnerId, OwnerName__c,Parent_Ticket__c,Owner_URL__c,timelineClassName__c, Preview_Name__c
        FROM Ticket_Message__c WHERE Record_Id_Form__c != '' AND Id IN :ticketMsgs ORDER BY CreatedDate DESC];

        List<Help_Desk_Message_Status__c> msgStatuses2 = [SELECT Id, Search_Formula__c, tableTimelineClass__c,Ticket_Message__r.OwnerId, 
        Ticket_Message__r.Parent_Ticket_Message__r.Preview__c,Ticket_Message__r.Parent_Ticket_Message__r.Id,Ticket_Message__r.Parent_Ticket_Message__r.Message__c,Ticket_Message__r.Parent_Ticket_Message__r.Owner_URL__c,Ticket_Message__r.Parent_Ticket_Message__r.OwnerName__c,Ticket_Message__r.Parent_Ticket_Message__r.OwnerId, Ticket_Message__r.Parent_Ticket_Message__r.Icon_Name__c,Ticket_Message__r.Parent_Ticket_Message__r.Closed_Thread__c, 
        Ticket_Message__r.Parent_Ticket_Message__r.DocumentId__c,Ticket_Message__r.Parent_Ticket_Message__r.CreatedDate,Ticket_Message__r.Parent_Ticket_Message__r.timelineClassName__c,Ticket_Message__r.Parent_Ticket_Message__r.Pinned__c,Ticket_Message__r.Parent_Ticket_Message__r.Thread__c,Ticket_Message__r.Parent_Ticket_Message__r.Parent_Record_Id__c, Ticket_Message__r.Parent_Ticket_Message__c, 
        Ticket_Message__r.Message__c,Ticket_Message__r.Preview__c, Ticket_Message__r.Id,Ticket_Message__r.Parent_Record_Id__c, Ticket_Message__r.CreatedDate,Ticket_Message__r.DocumentId__c,Ticket_Message__r.OwnerName__c, Ticket_Message__r.Owner_URL__c, CreatedDate, Name, Ticket_Message__c,Ticket_Message__r.Record_Id_Form__c,Ticket_Message__r.Icon_Name__c,Ticket_Message__r.Message_Source__c, OwnerId,Read__c,Liked__c 
        FROM Help_Desk_Message_Status__c WHERE OwnerId = :userId AND Ticket_Message__c IN: recentMsgs ORDER BY CreatedDate DESC];
        return msgStatuses2;
    }  
    @AuraEnabled(cacheable=true)
    public static list<Help_Desk_Message_Status__c> findRecentThreadTicketMessages(string userId){
        // id recordId_Val = recordId;
        // string recordString = recordId_Val;
        List<Help_Desk_Message_Status__c> msgStatuses = [SELECT Id, Ticket_Message__r.Message__c, Ticket_Message__r.Id, Ticket_Message__r.CreatedDate,Ticket_Message__r.DocumentId__c,Ticket_Message__r.OwnerName__c,Ticket_Message__r.Thread__c, Ticket_Message__r.Owner_URL__c,Ticket_Message__r.Message_Source__c, CreatedDate, Name, Ticket_Message__c,Ticket_Message__r.Record_Id_Form__c,Ticket_Message__r.Icon_Name__c,Ticket_Message__r.Parent_Record_Id__c, OwnerId,Read__c,Liked__c FROM Help_Desk_Message_Status__c WHERE OwnerId = :userId AND Ticket_Message__r.Message_Source__c = 'Message Thread' ORDER BY CreatedDate DESC];
        Set<Id> parentMsgIds = new Set<Id>();
        Set<Id> ticketMsgs = new Set<Id>();
        for(Help_Desk_Message_Status__c a: msgStatuses){
            if(parentMsgIds.contains(a.Ticket_Message__r.Parent_Record_Id__c)){
                continue;
            } else {
                parentMsgIds.add(a.Ticket_Message__r.Parent_Record_Id__c);
                ticketMsgs.add(a.Ticket_Message__c);
            }
        }
        List<Ticket_Message__c> recentMsgs = [SELECT Id, SeenBy__c,Thread__c, CreatedDate,Preview__c, DocumentId__c,Record_Id_Form__c, Parent_Record_Id__c, Name, Message__c, OwnerId, OwnerName__c,Parent_Ticket__c,Owner_URL__c,timelineClassName__c, Preview_Name__c
        FROM Ticket_Message__c WHERE Parent_Record_Id__c != '' AND Id IN :ticketMsgs ORDER BY CreatedDate DESC];

        List<Help_Desk_Message_Status__c> msgStatuses2 = [SELECT Id, Search_Formula__c, tableTimelineClass__c,Ticket_Message__r.OwnerId, 
        Ticket_Message__r.Parent_Ticket_Message__r.Preview__c,Ticket_Message__r.Parent_Ticket_Message__r.Id,Ticket_Message__r.Parent_Ticket_Message__r.Message__c,Ticket_Message__r.Parent_Ticket_Message__r.Owner_URL__c,Ticket_Message__r.Parent_Ticket_Message__r.OwnerName__c,Ticket_Message__r.Parent_Ticket_Message__r.OwnerId, Ticket_Message__r.Parent_Ticket_Message__r.Icon_Name__c,Ticket_Message__r.Parent_Ticket_Message__r.Closed_Thread__c, 
        Ticket_Message__r.Parent_Ticket_Message__r.DocumentId__c,Ticket_Message__r.Parent_Ticket_Message__r.CreatedDate,Ticket_Message__r.Parent_Ticket_Message__r.timelineClassName__c,Ticket_Message__r.Parent_Ticket_Message__r.Pinned__c,Ticket_Message__r.Parent_Ticket_Message__r.Thread__c,Ticket_Message__r.Parent_Ticket_Message__r.Parent_Record_Id__c, Ticket_Message__r.Parent_Ticket_Message__c, 
        Ticket_Message__r.Message__c,Ticket_Message__r.Preview__c, Ticket_Message__r.Id, Ticket_Message__r.CreatedDate,Ticket_Message__r.DocumentId__c,Ticket_Message__r.OwnerName__c, Ticket_Message__r.Owner_URL__c, CreatedDate, Name, Ticket_Message__c,Ticket_Message__r.Record_Id_Form__c,Ticket_Message__r.Icon_Name__c,Ticket_Message__r.Message_Source__c, OwnerId,Read__c,Liked__c 
        FROM Help_Desk_Message_Status__c WHERE OwnerId = :userId AND Ticket_Message__c IN: recentMsgs ORDER BY CreatedDate DESC];
        return msgStatuses2;
    }    
    // Use this method for the thread record container that sits on individual record pages and shows list of thread messages
    @AuraEnabled(cacheable=true)
    public static list<Ticket_Message__c> findRecordThreadTicketMessages(string recordId){
        id tempId = recordId;
        string recordString = tempId;
        List<Ticket_Message__c> recentMsgs = [SELECT Id, OwnerId, Message__c, Preview__c, DocumentId__c, OwnerName__c, Owner_URL__c, CreatedDate, Record_Id_Form__c, Icon_Name__c, Message_Source__c, Closed_Thread__c,Pinned__c,
        Parent_Ticket_Message__r.Preview__c, Parent_Ticket_Message__r.Id, Parent_Ticket_Message__r.Message__c, Parent_Ticket_Message__r.Owner_URL__c, Parent_Ticket_Message__r.OwnerName__c, Parent_Ticket_Message__r.OwnerId, Parent_Ticket_Message__r.Icon_Name__c, Parent_Ticket_Message__r.Closed_Thread__c, Parent_Ticket_Message__r.DocumentId__c, Parent_Ticket_Message__r.CreatedDate, Parent_Ticket_Message__r.timelineClassName__c, Parent_Ticket_Message__r.Pinned__c, Parent_Ticket_Message__r.Thread__c, Parent_Ticket_Message__r.Parent_Record_Id__c, Parent_Ticket_Message__c 
        FROM Ticket_Message__c WHERE Thread__c = true AND Record_Id_Form__c = :recordString ORDER BY CreatedDate DESC];

        return recentMsgs;
    }  
    @AuraEnabled
    public static Integer getNumberOfRecordOpenThreads(id recordId){
        List<Ticket_Message__c> recentMsgs = [SELECT Id, OwnerId, Message__c, Preview__c, DocumentId__c, OwnerName__c, Owner_URL__c, CreatedDate, Record_Id_Form__c, Icon_Name__c, Message_Source__c, Closed_Thread__c,
            Parent_Ticket_Message__r.Preview__c, Parent_Ticket_Message__r.Id, Parent_Ticket_Message__r.Message__c, Parent_Ticket_Message__r.Owner_URL__c, Parent_Ticket_Message__r.OwnerName__c, Parent_Ticket_Message__r.OwnerId, Parent_Ticket_Message__r.Icon_Name__c, Parent_Ticket_Message__r.Closed_Thread__c, Parent_Ticket_Message__r.DocumentId__c, Parent_Ticket_Message__r.CreatedDate, Parent_Ticket_Message__r.timelineClassName__c, Parent_Ticket_Message__r.Pinned__c, Parent_Ticket_Message__r.Thread__c, Parent_Ticket_Message__r.Parent_Record_Id__c, Parent_Ticket_Message__c 
            FROM Ticket_Message__c WHERE Thread__c = true AND Closed_Thread__c = false AND Record_Id_Form__c = :recordId ORDER BY CreatedDate DESC];
            return recentMsgs.size();
    }
    @AuraEnabled(cacheable=true)
    public static list<Ticket_Message__c> findRecentBookmarkedTicketMessages(string userId){
        List<Help_Desk_Message_Status__c> msgStatuses = [SELECT Id, Ticket_Message__r.Message__c,Ticket_Message__r.Message_Source__c, Ticket_Message__r.Id, Ticket_Message__r.CreatedDate,Ticket_Message__r.DocumentId__c,Ticket_Message__r.OwnerName__c, Ticket_Message__r.Owner_URL__c, CreatedDate, Name, Ticket_Message__c,Ticket_Message__r.Record_Id_Form__c,Ticket_Message__r.Parent_Record_Id__c,  OwnerId,Read__c,Liked__c,Bookmarked__c FROM Help_Desk_Message_Status__c WHERE OwnerId = :userId AND Bookmarked__c = true WITH SECURITY_ENFORCED ORDER BY CreatedDate DESC];
        Set<Id> parentMsgIds = new Set<Id>();
        Set<Id> ticketMsgs = new Set<Id>();
        for(Help_Desk_Message_Status__c a: msgStatuses){
            if(parentMsgIds.contains(a.Ticket_Message__c)){
                continue;
            } else {
                parentMsgIds.add(a.Ticket_Message__c);
                ticketMsgs.add(a.Ticket_Message__c);
            }
        }
        List<Ticket_Message__c> recentMsgs = [SELECT Id, SeenBy__c, CreatedDate,Preview__c, DocumentId__c,Record_Id_Form__c, Parent_Record_Id__c, Name, Message__c, OwnerId, OwnerName__c,Parent_Ticket__c,Owner_URL__c,timelineClassName__c, Preview_Name__c
        FROM Ticket_Message__c WHERE Record_Id_Form__c != '' AND Id IN :ticketMsgs WITH SECURITY_ENFORCED ORDER BY CreatedDate DESC];
        // List<Help_Desk_Message_Status__c> msgStatuses2 = [SELECT Id, Search_Formula__c,tableTimelineClass__c,Ticket_Message__r.Parent_Record_Id__c,Ticket_Message__r.OwnerId, Ticket_Message__r.Message__c,Ticket_Message__r.Preview__c, Ticket_Message__r.Id, Ticket_Message__r.CreatedDate,Ticket_Message__r.Message_Source__c,Ticket_Message__r.DocumentId__c,Ticket_Message__r.OwnerName__c,Ticket_Message__r.Icon_Name__c, Ticket_Message__r.Owner_URL__c, CreatedDate, Name, Ticket_Message__c,Ticket_Message__r.Record_Id_Form__c,OwnerId,Read__c,Liked__c, Bookmarked__c FROM Help_Desk_Message_Status__c WHERE OwnerId = :userId AND Bookmarked__c = true AND Ticket_Message__c IN: recentMsgs WITH SECURITY_ENFORCED ORDER BY CreatedDate DESC];
        return recentMsgs;
    }    
    // Used in Message Center to find threads specific to logged in user
    @AuraEnabled(cacheable=true)
    public static list<Help_Desk_Message_Status__c> findRecentRecordThreadTicketMessages(string userId, string recordId){
        id recordIdVal = recordId;
        string recordString = recordIdVal;
        List<Help_Desk_Message_Status__c> msgStatuses = [SELECT Id, Ticket_Message__r.Message__c, Ticket_Message__r.Id, Ticket_Message__r.CreatedDate,Ticket_Message__r.DocumentId__c,Ticket_Message__r.OwnerName__c,Ticket_Message__r.Thread__c, Ticket_Message__r.Owner_URL__c,Ticket_Message__r.Message_Source__c, 
        CreatedDate, Name, Ticket_Message__c,Ticket_Message__r.Record_Id_Form__c,Ticket_Message__r.Icon_Name__c,Ticket_Message__r.Parent_Record_Id__c,Ticket_Message__r.Parent_Ticket_Message__r.Record_Id_Form__c,Ticket_Message__r.Parent_Ticket_Message__r.Parent_Record_Id__c, OwnerId,Read__c,Liked__c 
        FROM Help_Desk_Message_Status__c WHERE OwnerId = :userId AND Ticket_Message__r.Parent_Ticket_Message__r.Parent_Record_Id__c =:recordString AND Ticket_Message__r.Message_Source__c = 'Message Thread' ORDER BY CreatedDate DESC];
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
        List<Ticket_Message__c> recentMsgs = [SELECT Id, SeenBy__c,Thread__c, CreatedDate,Preview__c, DocumentId__c,Record_Id_Form__c, Parent_Record_Id__c, Name, Message__c, OwnerId, OwnerName__c,Parent_Ticket__c,Owner_URL__c,timelineClassName__c, Preview_Name__c, Icon_Name__c, Pinned__c, CloseMsg__c
        FROM Ticket_Message__c WHERE Record_Id_Form__c != '' AND Id IN :ticketMsgs ORDER BY CreatedDate DESC];

        List<Help_Desk_Message_Status__c> msgStatuses2 = [SELECT Id, Search_Formula__c, tableTimelineClass__c,Ticket_Message__r.OwnerId, 
        Ticket_Message__r.Parent_Ticket_Message__r.Preview__c,Ticket_Message__r.Parent_Ticket_Message__r.Id,Ticket_Message__r.Parent_Ticket_Message__r.Message__c,Ticket_Message__r.Parent_Ticket_Message__r.Owner_URL__c,Ticket_Message__r.Parent_Ticket_Message__r.OwnerName__c,Ticket_Message__r.Parent_Ticket_Message__r.OwnerId, Ticket_Message__r.Parent_Ticket_Message__r.Icon_Name__c,Ticket_Message__r.Parent_Ticket_Message__r.Closed_Thread__c, 
        Ticket_Message__r.Parent_Ticket_Message__r.DocumentId__c,Ticket_Message__r.Parent_Ticket_Message__r.CreatedDate,Ticket_Message__r.Parent_Ticket_Message__r.timelineClassName__c,Ticket_Message__r.Parent_Ticket_Message__r.Pinned__c,Ticket_Message__r.Parent_Ticket_Message__r.Thread__c,Ticket_Message__r.Parent_Ticket_Message__r.Parent_Record_Id__c, Ticket_Message__r.Parent_Ticket_Message__c, 
        Ticket_Message__r.Message__c,Ticket_Message__r.Preview__c,Ticket_Message__r.Closed_Thread__c, Ticket_Message__r.Id, Ticket_Message__r.CreatedDate,Ticket_Message__r.DocumentId__c,Ticket_Message__r.OwnerName__c, Ticket_Message__r.Owner_URL__c, CreatedDate, Name, Ticket_Message__c,Ticket_Message__r.Record_Id_Form__c,Ticket_Message__r.Icon_Name__c,Ticket_Message__r.Message_Source__c, OwnerId,Read__c,Liked__c 
        FROM Help_Desk_Message_Status__c WHERE OwnerId = :userId AND Ticket_Message__c IN: recentMsgs ORDER BY CreatedDate DESC];
        return msgStatuses2;
    }  
    @AuraEnabled
    public static string markAllRead(string userId){
        List<Help_Desk_Message_Status__c> msgStatuses = [SELECT Id, Ticket_Message__r.Message__c, Ticket_Message__r.Id, Ticket_Message__r.CreatedDate,Ticket_Message__r.DocumentId__c,Ticket_Message__r.OwnerName__c,Ticket_Message__r.Thread__c, Ticket_Message__r.Owner_URL__c,Ticket_Message__r.Message_Source__c, 
        CreatedDate, Name, Ticket_Message__c,Ticket_Message__r.Record_Id_Form__c,Ticket_Message__r.Icon_Name__c,Ticket_Message__r.Parent_Record_Id__c,Ticket_Message__r.Parent_Ticket_Message__r.Record_Id_Form__c,Ticket_Message__r.Parent_Ticket_Message__r.Parent_Record_Id__c, OwnerId,Read__c,Liked__c 
        FROM Help_Desk_Message_Status__c WHERE OwnerId = :userId AND Read__c = false];
        list<Help_Desk_Message_Status__c> msgStatusesUpdate = new list<Help_Desk_Message_Status__c>();
        for(Help_Desk_Message_Status__c a: msgStatuses){
            if(msgStatusesUpdate.contains(a)){
                continue;
            } else {
                // parentMsgIds.add(a.Ticket_Message__r.Record_Id_Form__c);
                a.Read__c = true;
                msgStatusesUpdate.add(a);
            }
        }
        update msgStatusesUpdate;
        return 'Success';
    }

    @AuraEnabled
    public static string deleteThreadMember(Id recordId) {
        Help_Desk_Message_Status__c msgStatus = [SELECT Id FROM Help_Desk_Message_Status__c WHERE Id = :recordId WITH SECURITY_ENFORCED LIMIT 1];
        try{
            Database.delete(msgStatus.Id);
            return 'Delete Success';
        } catch(DmlException e) {
            return 'Delete Failed';
        }
    }

}