import { LightningElement, api, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { updateRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import getCurrentUserPhoto from '@salesforce/apex/BirthdayController.getCurrentUserPhoto';
import getCurUser from '@salesforce/apex/BirthdayController.getCurUser';
import createReadStatus from '@salesforce/apex/ChatController.createReadStatus';
import getRecentThreadMsg from '@salesforce/apex/ChatController.getRecentThreadMsg';
import getUserMsgStatus from '@salesforce/apex/ChatController.getUserMsgStatus';
// import MESSAGE_OBJECT from '@salesforce/schema/Help_Desk_Message_Status__c';
// import TICKET_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.Ticket_Message__c';
// import READ_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.Read__c';
import ID_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.Id';
import LIKED_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.Liked__c';
import MSGID_FIELD from '@salesforce/schema/Ticket_Message__c.Id';
import PINNED_FIELD from '@salesforce/schema/Ticket_Message__c.Pinned__c';
// import OWNER_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.OwnerId';
import USER_ID from '@salesforce/user/Id';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import EmailPreferencesAutoBccStayInTouch from '@salesforce/schema/User.EmailPreferencesAutoBccStayInTouch';

export default class ChatTimelineTile extends NavigationMixin(LightningElement) {
    @api timelinePost;
    @api curName;
    @api curUser;
    @api showPinned = false;
    @api showThread = false;
    showLikes = false;
    thread;
    smallPhotoThreadArr = [];
    smallPhotoThreads = [...new Set(this.smallPhotoThreadArr)];
    // smallPhotoThreads = [...new Set(array)];
    // smallPhotoThreadsSet = new Set();
    openThread = false;
    threadLen;
    recentMsg;
    recentThread;
    createdDate;
    createdDateParent;
    showRelDate;
    userId = USER_ID;
    smallPhotoUrl;
    showTime;
    seenBy; 
    statusId;
    error;
    liked;
    pinned;
    pinIcon;
    userMsgStatus;
    showLikes = false;
    editMsg;
    messageValue;
    isLoading;
    formats = [
        'bold',
        'italic',
        'underline',
        'strike',
        'list',
        'link',
        'image',
        'table',
        'header',
    ];  

    get numReplies() {
        if (this.threadLen > 1) {
            return this.threadLen + ' Replies';
        } else {
            return this.threadLen + ' Reply';
        }
    }

    get thread() {
        return this.timelinePost.Thread__c;
    }

    get smallPhotoThreadsList() {
        return this.removeDuplicates(this.smallPhotoThreads, "threadSmallPhotoUrl");
    }

    // get postOwner(){
    //     return this.recentThread[0].OwnerId;
    // }

    @wire(getRecentThreadMsg, {msgId: '$timelinePost.Id'})
    threadSetup(result) {
        this.recentThreadKey = result;
        const {data,error} = result;
        if(data){
            this.recentThread = JSON.parse(JSON.stringify(data));
            this.error = undefined;
            this.threadLen = this.recentThread.length;
            if (this.threadLen > 0) {
                this.openThread = true;
                this.recentMsg = this.recentThread[0];
                this.createdDate = new Date(this.recentMsg.CreatedDate);
                // console.log('ResultLen: ',this.threadLen);
                // console.log('recentMsg: ', JSON.stringify(this.recentMsg));
                // getCurrentUserPhoto({
                //     userId: this.recentMsg.OwnerId
                // })
                //     .then(result => {
                //         this.threadSmallPhotoUrl = result;
                //         this.handleHoverThread();
                //         this.handleNoHoverThread();
                //         this.error = undefined;
                //     })
                //     .catch(error => {
                //         this.threadSmallPhotoUrl = undefined;
                //         this.error = error;
                //         console.log(JSON.stringify(error));
                //     })
                this.recentThread.forEach(element => {
                    getCurrentUserPhoto({
                        userId: element.OwnerId
                    })
                        .then(result => {
                            this.threadSmallPhotoUrl = {
                                id: element.Id,
                                threadSmallPhotoUrl: result
                            };
                            this.smallPhotoThreads.push(this.threadSmallPhotoUrl);
                            this.handleHoverThread();
                            this.handleNoHoverThread();
                            this.error = undefined;
                        })
                        .catch(error => {
                            this.threadSmallPhotoUrl = undefined;
                            this.error = error;
                            console.log(JSON.stringify(error));
                        })
                });
                // console.log("Threads Before: "+JSON.stringify(this.smallPhotoThreads));
                // this.removeDuplicates(this.smallPhotoThreads, "threadSmallPhotoUrl");
                // console.log("Threads After: "+JSON.stringify(this.smallPhotoThreads))
                this.error = undefined;
            }
        }else if(error){
            console.log(JSON.stringify(error));
        }else{
            this.recentThread = [];
            this.error = undefined
        }
    }
     
    connectedCallback() {
        // console.log(this.timelinePost.Pinned__c);
        this.showRelDate = true;
        this.pinned = this.timelinePost.Pinned__c;
        // this.thread = this.timelinePost.Thread__c;
        this.createdDateParent = new Date(this.timelinePost.CreatedDate);
        // this.getThreadInfo();
        if (this.pinned) {
            this.pinIcon = 'utility:pinned';
        } else {
            this.pinIcon = 'utility:pin';
        }
        // this.getThreadInfo();
        getCurrentUserPhoto({
            userId: this.timelinePost.OwnerId
        })
            .then(result => {
                this.smallPhotoUrl = result;
                this.error = undefined;
            })
            .catch(error => {
                this.smallPhotoUrl = undefined;
                this.error = error;
                console.log(error);
            })
        getUserMsgStatus({
            userId: this.userId,
            msgId: this.timelinePost.Id
        })
            .then(result => {
                this.showLikes = true;
                this.userMsgStatus = result;
                this.liked = this.userMsgStatus.Liked__c;
                this.error = undefined;
            })
            .catch(error => {
                this.userMsgStatus = undefined;
                this.error = error;
                console.log(error);
            })
        createReadStatus({
            ticketMessageId: this.timelinePost.Id,
            userId: this.userId
        })
            .then(result => {
                //console.log(JSON.stringify(result));
                this.statusId = result;
                this.error = undefined;
            })
            .catch(error => {
                this.statusId = undefined;
                this.error = error;
            })
        this.editMsg = false;
        this.setValues();
    }
    removeDuplicates(arr, prop) {
        let obj = {};
        return arr.filter(function(item) {
            let value = item[prop];
            return obj.hasOwnProperty(value) ? false : (obj[value] = true);
        });
    }
    @api
    refreshThread() {
        const selectEvent = new CustomEvent('refresh', {
            detail: {
                Id: this.timelinePost.Id,
                parentId: this.timelinePost.Parent_Ticket__c
            }
        });
        this.dispatchEvent(selectEvent);  
        return refreshApex(this.recentThreadKey);
    }
    getThreadInfo() {
       getRecentThreadMsg({
            msgId: this.timelinePost.Id
        })
            .then(result => {
                this.recentThread = result;
                this.threadLen = this.recentThread.length;
                if (this.threadLen > 0) {
                    this.openThread = true;
                    this.recentMsg = this.recentThread[0];
                    this.createdDate = new Date(this.recentMsg.CreatedDate);
                    console.log('ResultLen: ',this.threadLen);
                    console.log('recentMsg: ',JSON.stringify(this.recentMsg));
                    getCurrentUserPhoto({
                        userId: this.recentMsg.OwnerId
                    })
                        .then(result => {
                            this.threadSmallPhotoUrl = result;
                            this.handleHoverThread();
                            this.handleNoHoverThread();
                            this.error = undefined;
                        })
                        .catch(error => {
                            this.threadSmallPhotoUrl = undefined;
                            this.error = error;
                            console.log(JSON.stringify(error));
                        })
                    this.error = undefined;
                } else {
                    this.openThread = false;
                }
            })
            .catch(error => {
                this.error = error;
                console.log(JSON.stringify(error));
            })
    }
    openPreview(){
        //let elementId = event.currentTarget.dataset.id;
        this[NavigationMixin.Navigate]({
            type: 'standard__namedPage',
            attributes: {
                pageName: 'filePreview'
            },
            state : {
                selectedRecordId: this.timelinePost.DocumentId__c
            }
        })
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
                        message: 'Message Status Updated',
                        variant: 'success'
                    })
                );
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error Liking Message - Screenshot Me and send to your Salesoforce Administrator',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
            });
    }
    handlePinned(event) {
        event.preventDefault();
        this.pinned = !this.pinned;
        if (this.pinned) {
            this.pinIcon = 'utility:pinned';
        } else {
            this.handleSuccess(event);
            this.pinIcon = 'utility:pin';
        }
        const fields = {};
        fields[MSGID_FIELD.fieldApiName] = this.timelinePost.Id;
        fields[PINNED_FIELD.fieldApiName] = this.pinned;
        
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
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error Liking Message - Screenshot Me and send to your Salesoforce Administrator',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
            });
    }    
    handleHover(){
        const eventElement2 = this.template.querySelector('lightning-button-group[data-id="hoverSelectButtons"]');
        eventElement2.classList.remove('slds-hide');
    }
    handleNoHover(){
        const eventElement2 = this.template.querySelector('lightning-button-group[data-id="hoverSelectButtons"]');
        eventElement2.classList.add('slds-hide');
    }
    handleHoverThread() {
        this.showRelDate = false;
        const eventElement = this.template.querySelector('lightning-button-icon[data-id="hoverSelect"]');
        eventElement.classList.remove('slds-hide');
    }
    handleNoHoverThread() {
        this.showRelDate = true;
        const eventElement = this.template.querySelector('lightning-button-icon[data-id="hoverSelect"]');
        eventElement.classList.add('slds-hide');
    }
    openSeenBy(event){
        event.preventDefault();
        const selectEvent = new CustomEvent('seen', {
            detail: {
                id: this.timelinePost.Id,
                ticketMsg: this.timelinePost,
                inThread: true
            }
        });
        this.dispatchEvent(selectEvent);  
    }
    handleOpenThread(event){
        event.preventDefault();
        const selectEvent = new CustomEvent('thread', {
            detail: {
                id: this.timelinePost.Id,
                ticketMsg: this.timelinePost,
                inThread: false
            }
        });
        this.dispatchEvent(selectEvent);  
    }
    editMessage() {
        this.editMsg = true;
    }
    handleMessageChange(event) {
        this.messageValue = event.target.value;
    }    
    handleSubmit() {
        this.isLoading = true;
    }
    handleSuccess(event) {
        event.preventDefault();
        event.stopPropagation();
        this.isLoading = false;
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'Message Updated',
                variant: 'success'
            })
        );
        const selectEvent = new CustomEvent('refresh', {
            detail: {
                Id: this.timelinePost.Id,
                parentId: this.timelinePost.Parent_Ticket__c
            }
        });
        this.dispatchEvent(selectEvent);  
        this.cancelEdit();
    }
    cancelEdit() {
        this.editMsg = false;
    }
    closeTicket(event){
        event.preventDefault();
        event.stopPropagation();
        const selectEvent = new CustomEvent('close', {
            detail: {
                Id: this.timelinePost.Id,
                parentId: this.timelinePost.Parent_Ticket__c
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
}