import { LightningElement, api, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { updateRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import getCurrentUserPhoto from '@salesforce/apex/BirthdayController.getCurrentUserPhoto';
import getCurUser from '@salesforce/apex/BirthdayController.getCurUser';
import createReadStatus from '@salesforce/apex/ChatController.createReadStatus';
import getUserMsgStatus from '@salesforce/apex/ChatController.getUserMsgStatus';
import getUnreadTimelineMessagesNum from '@salesforce/apex/NASController.getUnreadTimelineMessagesNum';
// import MESSAGE_OBJECT from '@salesforce/schema/Help_Desk_Message_Status__c';
// import TICKET_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.Ticket_Message__c';
// import READ_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.Read__c';
import ID_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.Id';
import LIKED_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.Liked__c';
import PARENT_FIELD from '@salesforce/schema/Ticket_Message__c.Id';
import CLOSED_FIELD from '@salesforce/schema/Ticket_Message__c.Closed_Thread__c';

// import OWNER_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.OwnerId';
import USER_ID from '@salesforce/user/Id';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class NotificationListTile extends NavigationMixin(LightningElement) {
    @api msgStatus;
    @api curName;
    @api curUser;
    @api showConversation = false;
    @api showThread = false;
    // @api unreadMsgs = [];
    userId = USER_ID;
    smallPhotoUrl;
    showTime;
    seenBy; 
    statusId;
    error;
    liked;
    userMsgStatus;
    showLikes = false;
    isLoading;
    disableButton;
    previewKey;
    newMessages;
    lastSavedNumData;
    numMsgs;

    get avatarClass() {
        if (this.smallPhotoUrl) {
            return 'avatarBorder';
        } else {
            return '';
        }
    }

    get threadPreview() {
        return 'Thread - '+this.msgStatus.Ticket_Message__r.Parent_Ticket_Message__r.Preview__c + ' (' +this.numMsgs+')';
    }

    get preview() {
        return this.msgStatus.Ticket_Message__r.Preview__c + ' (' +this.numMsgs+')';
    }

    get createdDate() {
        return  new Date(this.msgStatus.Ticket_Message__r.CreatedDate);
    }
    get createdDateParent() {
        return new Date(this.msgStatus.Ticket_Message__r.Parent_Ticket_Message__r.CreatedDate);
    }
    get createdDateVal() {
        return  this.msgStatus.Ticket_Message__r.CreatedDate;
    }
    get createdDateParentVal() {
        return this.msgStatus.Ticket_Message__r.Parent_Ticket_Message__r.CreatedDate;
    }

    // get numMsgs() {
    //     return this.unreadMsgsVar.length;
    // }
    // get unreadMsgsVar() {
    //     return this.unreadMsgs.filter(obj => obj.Ticket_Message__r.Parent_Record_Id__c === this.msgStatus.Ticket_Message__r.Parent_Record_Id__c);
    // }
    get msgOwnerURL() {
        return this.msgStatus.Ticket_Message__r.Owner_URL__c;
    }
    get msgOwnerName() {
        return this.msgStatus.Ticket_Message__r.OwnerName__c;
    }
    get msgValue() {
        return this.msgStatus.Ticket_Message__r.Message__c;
    }
    get msgParentOwnerURL() {
        return this.msgStatus.Ticket_Message__r.Parent_Ticket_Message__r.Owner_URL__c;
    }
    get msgParentOwnerName() {
        return this.msgStatus.Ticket_Message__r.Parent_Ticket_Message__r.OwnerName__c;
    }
    get msgParentValue() {
        return this.msgStatus.Ticket_Message__r.Parent_Ticket_Message__r.Message__c;
    }
    get msgTableTimelineClass() {
        return this.msgStatus.Ticket_Message__r.tableTimelineClass__c;
    }
    get msgDocumentId() {
        return this.msgStatus.Ticket_Message__r.DocumentId__c;
    }
    get msgParentIconName() {
        return this.msgStatus.Ticket_Message__r.Parent_Ticket_Message__r.Icon_Name__c;
    }
    get msgIconName() {
        return this.msgStatus.Ticket_Message__r.Icon_Name__c;
    }

    // get numMsgs() {
    //     let tempVar = [];
    //     tempVar = this.unreadMsgs.filter(obj => obj.Parent_Record_Id__c === this.msgStatus.Parent_Record_Id__c);
    //     let tempVar3 = tempVar.length;
    //     return tempVar3;
    // }
    @wire(getUnreadTimelineMessagesNum, { userId: '$userId', parentRecId: '$msgStatus.Ticket_Message__r.Parent_Record_Id__c' })
    numMsgSetup(result) {
        this.newMessages = result;
        const { data, error } = result;
        if (data) {
            this.numMsgs = JSON.parse(JSON.stringify(data));
            this.error = undefined;
        } else if (error) {
            this.numMsgs = undefined;
            this.error = error;
            console.error(error);
        } else {
            this.error = undefined;
            this.numMsgs = undefined;
        }
        this.lastSavedNumData = this.numMsgs;
        this.isLoading = false;
    };    
    ;

    @wire(getCurrentUserPhoto, {
        userId: '$msgStatus.Ticket_Message__r.OwnerId'
    })
    ticketSetup(result) {
        this.smallPhotoUrlKey = result;
        const { data, error } = result;
        if (data) {
            this.smallPhotoUrl = JSON.parse(JSON.stringify(data));
            this.error = undefined;
        } else if (error) {
            this.smallPhotoUrl = undefined;
            this.error = error;
            console.error(error);
        } else {
            this.error = undefined;
            this.smallPhotoUrl = undefined;
        }
        this.lastSavedData = this.smallPhotoUrl;
        this.isLoading = false;
    };    
    @wire(getUserMsgStatus, {
        userId: '$ticketUser.Id',
        msgId: '$timelinePostId'
    })
    statusSetup(result) {
        this.msgStatusKey = result;
        const { data, error } = result;
        if (data) {
            this.userMsgStatus = JSON.parse(JSON.stringify(data));
            this.liked = this.userMsgStatus.Liked__c;
            this.error = undefined;
        } else if (error) {
            this.userMsgStatus = undefined;
            this.error = error;
            console.error(error);
        } else {
            this.error = undefined;
            this.userMsgStatus = undefined;
        }
        this.lastSavedData = this.userMsgStatus;
        this.isLoading = false;
    };

    connectedCallback() {
        this.showLikes = true;
        // this.createdDate = new Date(this.msgStatus.Ticket_Message__r.CreatedDate);
        if (this.msgStatus.Ticket_Message__r.Message_Source__c === 'Message Thread') {
            this.showThread = true;
        } else {
            this.showConversation = true;
        }
        console.log('msgStatus: ' + JSON.stringify(this.msgStatus));
        // this.tempVar = [];
        // this.tempVar = this.unreadMsgs.filter(obj => obj.Ticket_Message__r.Parent_Record_Id__c === this.msgStatus.Ticket_Message__r.Parent_Record_Id__c);
        this.setValues();
    }
    renderedCallback(){
        refreshApex(this.smallPhotoUrlKey);
        refreshApex(this.msgStatusKey);
    }
    @api
    refreshMe() {
        refreshApex(this.smallPhotoUrlKey);
        refreshApex(this.msgStatusKey);
        this.connectedCallback();
    }
    openPreview(){
        //let elementId = event.currentTarget.dataset.id;
        this[NavigationMixin.Navigate]({
            type: 'standard__namedPage',
            attributes: {
                pageName: 'filePreview'
            },
            state : {
                selectedRecordId: this.msgStatus.Ticket_Message__r.DocumentId__c
            }
        })
    }
    handleOpen(event) {
        event.preventDefault();
        event.stopPropagation();
        if (this.msgStatus.Ticket_Message__r.Message_Source__c === 'Message Thread') {
            const parentId = this.msgStatus.Ticket_Message__r.Parent_Ticket_Message__r.Parent_Record_Id__c;
            console.log("ParentId: "+parentId)
            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: parentId,
                    actionName: 'view'
                }
            });
        } else {
            const parentId = this.msgStatus.Ticket_Message__r.Parent_Record_Id__c;
            console.log("ParentId: "+parentId)
            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: parentId,
                    actionName: 'view'
                }
            });
        }
    }
    // handleOpenThread() {
    //     const parentId = this.msgStatus.Ticket_Message__r.Parent_Ticket_Message__r.Parent_Record_Id__c;
    //     console.log("ParentId: "+parentId)
    //     this[NavigationMixin.Navigate]({
    //         type: 'standard__recordPage',
    //         attributes: {
    //             recordId: parentId,
    //             actionName: 'view'
    //         }
    //     });
    // }
    handleResolve(event) {
        event.stopPropagation();
        event.preventDefault();
        this.isLoading = true;
        this.disableButton = true;
        const fields = {};
        fields[PARENT_FIELD.fieldApiName] = this.msgStatus.Ticket_Message__r.Parent_Ticket_Message__c;
        fields[CLOSED_FIELD.fieldApiName] = true;

        const recordInput = { fields };

        updateRecord(recordInput)
            .then(() => {
                this.isLoading = false;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Thread Resolved',
                        variant: 'success'
                    })
                );
                this.disableButton = false;
                this.handleRefresh();
            })
            .catch(error => {
                console.log(JSON.stringify(error));
                this.isLoading = false;
                this.disableButton = false;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error Resolving Message Thread',
                        message: 'Screenshot Me and send to your Salesforce Administrator',
                        variant: 'error'
                    })
                );
            });
    }
    handleReopen(event) {
        event.stopPropagation();
        event.preventDefault();
        this.isLoading = true;
        this.disableButton = true;
        const fields = {};
        fields[PARENT_FIELD.fieldApiName] = this.msgStatus.Ticket_Message__r.Parent_Ticket_Message__c;
        fields[CLOSED_FIELD.fieldApiName] = false;

        const recordInput = { fields };

        updateRecord(recordInput)
            .then(() => {
                this.isLoading = false;
                this.disableButton = false;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Thread Re-Opened',
                        variant: 'success'
                    })
                );
                this.handleRefresh();
            })
            .catch(error => {
                this.isLoading = false;
                this.disableButton = false;
                console.log(JSON.stringify(error));
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error Re-Opening Message Thread',
                        message: 'Screenshot Me and send to your Salesforce Administrator',
                        variant: 'error'
                    })
                );
            });
    }
    handleLiked(event) {
        event.preventDefault();
        this.liked = !this.liked;
        const fields = {};
        fields[ID_FIELD.fieldApiName] = this.userMsgStatus.Id;
        fields[LIKED_FIELD.fieldApiName] = this.liked;

        const recordInput = { fields };

        updateRecord(recordInput)
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Message Updated',
                        variant: 'success'
                    })
                );
                // Display fresh data in the form
                return refreshApex(this.contact);
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error Liking Message - Screenshot Me and send to your Salesforce Administrator',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
            });
    }
    handleHover(){
        const eventElement = this.template.querySelector('lightning-formatted-date-time[data-id="hoverSelect"]');
        eventElement.classList.remove('slds-hide');
    }
    handleNoHover(){
        const eventElement = this.template.querySelector('lightning-formatted-date-time[data-id="hoverSelect"]');
        eventElement.classList.add('slds-hide');
    }
    openSeenBy(event){
        event.preventDefault();
        event.stopPropagation();
        const selectEvent = new CustomEvent('seen', {
            detail: this.msgStatus.Ticket_Message__r.Id
        });
        this.dispatchEvent(selectEvent);  
    }
    handleRefresh(){
        const selectEvent = new CustomEvent('refresh', {
            detail: this.msgStatus.Ticket_Message__r.Id
        });
        this.dispatchEvent(selectEvent);  
    }
    closeTicket(event){
        event.preventDefault();
        event.stopPropagation();
        const selectEvent = new CustomEvent('close', {
            detail: {
                Id: this.msgStatus.Ticket_Message__r.Id,
                parentId: this.msgStatus.Ticket_Message__r.Parent_Ticket__c
            }
        });
        this.dispatchEvent(selectEvent);  
    }
    setValues(){
        //console.log(this.userId);
        getCurUser({userId:this.userId})
        .then((result) => {
            //console.log(JSON.stringify(result));
            this.curUser = result;
            this.curName = result.Name;
            this.error = undefined;
        })
        .catch((error) => {
            this.error = error;
            this.curUser = undefined;
        });
    }
    handleOpenTimeline() {
        // event.preventDefault();custom event
        // event.stopPropagation();
        console.log("MsgStatus :"+this.msgStatus);
        let parentId = this.msgStatus.Ticket_Message__r.Record_Id_Form__c;
        let timelinePostThread = this.msgStatus.Ticket_Message__r.Parent_Ticket_Message__r;
        let timelinePost = this.msgStatus.Ticket_Message__r;
        let source = this.msgStatus.Ticket_Message__r.Message_Source__c;
        let tempPreview = this.msgStatus.Ticket_Message__r.Preview__c;
        let threadMsgId = this.msgStatus.Ticket_Message__r.Parent_Ticket_Message__c;
        let msgId = this.msgStatus.Ticket_Message__r.Id;
        if(this.msgStatus.Ticket_Message__r.Message_Source__c === 'Message Thread'){
            const selectEvent = new CustomEvent('opentimeline', {
                detail: {
                        msgId: threadMsgId,
                        id: parentId,
                        timelinePost: timelinePostThread,
                        source: source,
                        preview: tempPreview
                    }
                }
            );
            this.dispatchEvent(selectEvent);  
        }
        else{
            const selectEvent2 = new CustomEvent('opentimeline', {
                detail: {
                        msgId: msgId,
                        id: parentId,
                        source: source,
                        timelinePost: timelinePost,
                        preview: tempPreview
                    }
                }
            );
            this.dispatchEvent(selectEvent2);  
        }
    }    
    handleMarkRead(event) {
        event.preventDefault();
        event.stopPropagation();
        this.isLoading = true;
        createReadStatus({
            ticketMessageId: this.msgStatus.Ticket_Message__c,
            userId: this.userId
        })
        .then(result => {
            this.handleRefresh();
            this.isLoading = false;
            this.statusId = result;
            this.error = undefined;
        })
        .catch(error => {
            console.log(JSON.stringify(error));
            this.isLoading = false;
            this.statusId = undefined;
            this.error = error;
        })
    }
}