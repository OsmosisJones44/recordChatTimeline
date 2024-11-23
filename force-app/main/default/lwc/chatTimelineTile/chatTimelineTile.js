import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { updateRecord } from 'lightning/uiRecordApi';
import getCurrentUserPhoto from '@salesforce/apex/BirthdayController.getCurrentUserPhoto';
import getCurUser from '@salesforce/apex/BirthdayController.getCurUser';
import getUserList from '@salesforce/apex/BirthdayController.getUserList';
import createReadStatus from '@salesforce/apex/ChatController.createReadStatus';
import getRecentThreadMsg from '@salesforce/apex/ChatController.getRecentThreadMsg';
// import getVersionFilesNum from '@salesforce/apex/contentManager.getVersionFilesNum';
import getUserMsgStatus from '@salesforce/apex/ChatController.getUserMsgStatus';
import getUserMsgStatuses from '@salesforce/apex/ChatController.getUserMsgStatuses';
// import MESSAGE_OBJECT from '@salesforce/schema/Help_Desk_Message_Status__c';
// import TICKET_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.Ticket_Message__c';
// import READ_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.Read__c';
import ID_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.Id';
import LIKED_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.Liked__c';
import BOOKMARKED_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.Bookmarked__c';
import MSGID_FIELD from '@salesforce/schema/Ticket_Message__c.Id';
import PINNED_FIELD from '@salesforce/schema/Ticket_Message__c.Pinned__c';

// import OWNER_FIELD from '@salesforce/schema/Help_Desk_Message_Status__c.OwnerId';
import USER_ID from '@salesforce/user/Id';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class ChatTimelineTile extends NavigationMixin(LightningElement) {
    @api timelinePost;
    @api recordId;
    @api curName;
    @api curUser;
    @api showPinned = false;
    @api showThread = false;
    @api showBookmarked = false;
    @api avatarSize;
    showLikes = false;
    smallPhotoThreadsList = [];
    msgStatusList;
    // smallPhotoThreadArr = [];
    // smallPhotoThreads = [...new Set(this.smallPhotoThreadArr)];
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
    likedBy
    statusId;
    error;
    liked;
    pinned;
    bookmarked;
    pinIcon;
    bookmarkedIcon;
    userMsgStatus;
    showLikes = false;
    editMsg = false;
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
    get lastReply() {
        if (this.threadLen > 1) {
            return 'Last Reply ';
        } else {
            return '';
        }
    } 
    get viewThreadVal() {
        if (this.timelinePost.Closed_Thread__c !== true) {
            return 'View Open Thread';
        } else {
            return 'View Resolved Thread';
        }
    } 
    get threadStatus() {
        if (this.timelinePost.Closed_Thread__c !== true) {
            return 'Open';
        } else {
            return 'Resolved';
        }
    }    
    get threadStatusClass() {
        if (this.timelinePost.Closed_Thread__c !== true) {
            return 'openThread slds-truncate';
        } else {
            return 'resolvedThread slds-truncate';
        }
    }   

    get thread() {
        return this.timelinePost.Thread__c;
    }

    get timelineClassName() {
        return this.timelinePost.timelineClassName__c + this.bookmarkedClassName;
    }
    
    get bookmarkedClassName(){
        if(this.bookmarked){
             return ' bookmarkedClass';
        }else{
            return '';
        }
    }

    get smallPhotoThreadsList() {
        return this.removeDuplicates(this.smallPhotoThreads, "threadSmallPhotoUrl");
    }
     
    connectedCallback() {
        this.showRelDate = true;
        this.pinned = this.timelinePost.Pinned__c;
        this.createdDateParent = new Date(this.timelinePost.CreatedDate);
        if (this.pinned) {
            this.pinIcon = 'utility:pinned';
        } else {
            this.pinIcon = 'utility:pin';
        }
        // this.getVersionFilesNum();
        this.getRecentThreadMsg();
        this.getCurUserPhoto();
        this.bookmarkedIcon = 'utility:bookmark_stroke';
        this.createReadStatus();
        this.getUserMsgStatuses()
    }
    // getVersionFilesNum(){
    //     getVersionFilesNum( { recordId: this.recordId })
    //         .then(result =>{
    //             this.numFiles = JSON.parse(JSON.stringify(result));
    //         }).catch(err =>{
    //             console.error(err);
    //         })
    // }
    getRecentThreadMsg(){
        getRecentThreadMsg({ msgId: this.recordId })
        .then(result => {
            if (result && result.length > 0) {
                this.recentThread = [...result];
                this.error = undefined;
                this.threadLen = this.recentThread.length;
                this.openThread = true;
                this.recentMsg = this.recentThread[0];
                this.createdDate = new Date(this.recentMsg.CreatedDate);

                const userIdSet = new Set();
                this.recentThread.forEach(thread => userIdSet.add(thread.OwnerId));

                const userIdList = Array.from(userIdSet);

                getUserList({
                        userIds: userIdList
                    })
                    .then(result => {
                        this.smallPhotoThreadsList = result.slice(0, 4);
                        // this.handleHoverThread();
                        // this.handleNoHoverThread();
                        // this.handleHoverFile();
                        // this.handleNoHoverFile();
                        this.error = undefined;
                    })
                    .catch(error => {
                        this.smallPhotoThreadsList = undefined;
                        this.error = error;
                        console.error(error);
                    });
            } else {
                this.error = "No recent thread messages found.";
            }
        }).catch(err => {
            console.error(err);
        });
    }
    refresh(){
        this.getRecentThreadMsg();
        // this.getVersionFilesNum();
    }
    getCurUserPhoto(){
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
    }
    // getUserMsgStatus(){
    //     getUserMsgStatus({
    //         userId: this.userId,
    //         msgId: this.recordId
    //     })
    //         .then(result => {
    //             this.showLikes = true;
    //             this.userMsgStatus = result;
    //             this.liked = this.userMsgStatus?.Liked__c;
    //             this.bookmarked = this.userMsgStatus?.Bookmarked__c;
    //             if (this.bookmarked) {
    //                 this.bookmarkedIcon = 'utility:bookmark_alt';
    //             } else {
    //                 this.bookmarkedIcon = 'utility:bookmark_stroke';
    //             }
    //             this.error = undefined;
    //         })
    //         .catch(error => {
    //             this.userMsgStatus = undefined;
    //             this.error = error;
    //             console.log(error);
    //         })
    // }
    getUserMsgStatuses(){
        getUserMsgStatuses({
            msgId: this.recordId
        })
            .then(result => {
                this.showLikes = true;
                const res = result;
                this.msgStatusList = res;
                this.userMsgStatus = res.filter(el => {
                    el.Id === this.userId;
                });
                this.liked = this.userMsgStatus?.Liked__c;
                this.bookmarked = this.userMsgStatus?.Bookmarked__c;
                if (this.bookmarked) {
                    this.bookmarkedIcon = 'utility:bookmark_alt';
                } else {
                    this.bookmarkedIcon = 'utility:bookmark_stroke';
                }
                this.error = undefined;
            })
            .catch(error => {
                this.userMsgStatus = undefined;
                this.error = error;
                console.log(error);
            })
    }
    createReadStatus(){
        createReadStatus({
            ticketMessageId: this.recordId,
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
                Id: this.recordId,
                parentId: this.timelinePost.Parent_Ticket__c
            }
        });
        this.dispatchEvent(selectEvent);  
        this.refresh();
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
        const fields = {};
        fields[MSGID_FIELD.fieldApiName] = this.recordId;
        fields[PINNED_FIELD.fieldApiName] = this.pinned;
        
        const recordInput = { fields };
        
        updateRecord(recordInput)
        .then(() => {
                if (this.pinned) {
                    this.pinIcon = 'utility:pinned';
                } else {
                    // this.handleSuccess(event);
                    this.pinIcon = 'utility:pin';
                }
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Message Updated',
                        variant: 'success'
                    })
                );
                this.fireRefresh();
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
    handleBookmarked(event) {
        event.preventDefault();
        this.bookmarked = !this.bookmarked;
        const fields = {};
        fields[ID_FIELD.fieldApiName] = this.userMsgStatus.Id;
        fields[BOOKMARKED_FIELD.fieldApiName] = this.bookmarked;
        
        const recordInput = { fields };
        
        updateRecord(recordInput)
        .then(() => {
                if (this.bookmarked) {
                    this.bookmarkedIcon = 'utility:bookmark_alt';
                } else {
                    // this.handleSuccess(event);
                    this.bookmarkedIcon = 'utility:bookmark_stroke';
                }
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Message Updated',
                        variant: 'success'
                    })
                );
                this.fireRefresh();
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error Bookmarking Message - Screenshot Me and send to your Salesoforce Administrator',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
            });
    }  
    handleUploadFinished(event) {
        const uploadedFiles = event.detail.files;
        this.dispatchEvent(
            new ShowToastEvent({
                title: "Success!",
                message: uploadedFiles.length + " Files Uploaded Successfully.",
                variant: "success"
            })
        );
        this.refresh();
        this.callRefreshFile();
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
    handleHoverFile() {
        const eventElement = this.template.querySelector('c-record-chat-file-container');
        eventElement.classList.remove('slds-hide');
    }
    handleNoHoverFile() {
        const eventElement = this.template.querySelector('c-record-chat-file-container');
        eventElement.classList.add('slds-hide');
    }
    openSeenBy(event){
        event.preventDefault();
        const selectEvent = new CustomEvent('seen', {
            detail: {
                id: this.recordId,
                ticketMsg: this.timelinePost,
                inThread: true
            }
        });
        this.dispatchEvent(selectEvent);  
    }
    handleOpenThread(event){
        // console.log('TimelinePost: ' + JSON.stringify(this.timelinePost));
        event.preventDefault();
        const selectEvent = new CustomEvent('thread', {
            detail: {
                id: this.recordId,
                ticketMsg: this.timelinePost,
                inThread: false,
            }
        });
        this.dispatchEvent(selectEvent);  
    }
    handleOpenThreadIndividually() {
        console.log('Navigation Attempt');
        this[NavigationMixin.GenerateUrl](
            {
                type: "standard__app",
                attributes: {
                    appTarget: "c__TRPG_Timelines",
                    pageRef: {
                        type: 'standard__namedPage',
                        attributes: {
                            pageName: 'home'
                        },
                        state: {
                            c__threadId: this.recordId,
                        }
                    }
                }
            }).then(url =>{
                window.open(url, "_blank");
            }).catch(err => {
                console.error('NavError: '+err);
            }).finally(() => 'Navigated');
    } 
    editMessage() {
        this.editMsg = true;
        this.showFiles = false;
        this.isLoading = true;
    }
    handleMessageChange(event) {
        this.messageValue = event.target.value;
    }    
    handleLoad(){
        this.isLoading = false;
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
        this.fireRefresh();
        this.cancelEdit();
    }
    fireRefresh(){
        const selectEvent = new CustomEvent('refresh', {
            detail: {
                Id: this.recordId,
                parentId: this.timelinePost.Parent_Ticket__c
            }
        });
        this.dispatchEvent(selectEvent);  
    }
    cancelEdit() {
        this.editMsg = false;
        this.refresh();
        this.callRefreshFile();
        this.connectedCallback();
    }
    @api
    callRefreshFile(){
        const el = this.template.querySelector('c-record-chat-file-container');
        el.refresh();
    }
    closeTicket(event){
        event.preventDefault();
        event.stopPropagation();
        const selectEvent = new CustomEvent('close', {
            detail: {
                Id: this.recordId,
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