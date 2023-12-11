import { LightningElement, wire, api } from 'lwc';
import markAllRead from '@salesforce/apex/ChatController.markAllRead';
import findRecentOpenTicketMessages from '@salesforce/apex/ChatController.findRecentOpenTicketMessages';
import findRecentOpenThreadTicketMessages from '@salesforce/apex/ChatController.findRecentOpenThreadTicketMessages';
import getUnreadTimelineMessages from '@salesforce/apex/NASController.getUnreadTimelineMessages';
import getReadUsers from '@salesforce/apex/BirthdayController.getReadUsers';
// import getTicketMembers from '@salesforce/apex/BirthdayController.getTicketMembers';
// import getSetupMembers from '@salesforce/apex/BirthdayController.getSetupMembers';
// import getCashRequestMembers from '@salesforce/apex/BirthdayController.getCashRequestMembers';
import { subscribe as sub, unsubscribe as unsub, publish, MessageContext } from 'lightning/messageService';
import TRADINGDESKMESSAGE from '@salesforce/messageChannel/TradingDeskMessage__c';
// import getRecordMembers from '@salesforce/apex/BirthdayController.getRecordMembers';
import USER_ID from '@salesforce/user/Id';
import OFFICE_SPACE from '@salesforce/resourceUrl/Office_Space';
import { refreshApex } from '@salesforce/apex';
import {
    subscribe,
    unsubscribe,
    onError,
    setDebugFlag,
    isEmpEnabled,
} from 'lightning/empApi';

const columns = [
    {
        label: 'Name',
        fieldName: 'Name',
        wrapText: true,
        sortable: true
    },
    {
        label: 'Rec',
        fieldName: 'Record_Id_Form__c',
        wrapText: true,
        sortable: true
    }
];

export default class NotificationList extends LightningElement {
    recordId;
    userId = USER_ID;
    columns = columns;
    officeSpacePic = OFFICE_SPACE;
    showTimeline;
    trueValue = true;
    isLoading = false;
    lastSavedData;
    lastSavedOpenData;
    showMembers = false;
    showCustom = false;
    ticketMembers;
    setupMembers;
    cashRequestMembers;
    userTitle;
    ticketUsers = {};
    objectName;
    recentMsgs = [];
    recentMsgKey;
    recentOpenMsgs = [];
    recentOpenMsgKey;
    showAll;
    mainArea;
    showSearch;
    error;
    timelineTitle;
    openMsgs = [];
    mergedObj = {};
    numNewMsgs = 0;
    newMessages;
    modalHeader;
    isModalOpen;
    ticketSeenUsers;
    ticketUsers;
    ticketMessageId;
    tempTicketMessageId;
    messageSource;
    ticketMsg;


    get noNewMsg() {
        if (this.openMsgs.length > 0) {
            return false;
        } else {
            return true;
        }
    }   
    get pageTitle() {
        if (this.newMessages.data) {
            return 'Unread Messages ('+this.newMessages.data.length+')';
        } else {
            return 'Unread Messages (-)'
        }
    }
    get showThread() {
        if (this.messageSource === "Message Thread") {
            return true;
        } else {
            return false;
        }
    }
    get timelineView() {
        if (this.messageSource === "Message Thread") {
            return false;
        } else {
            return true;
        }
    }

    get ticketMessageId() {
        return this.tempTicketMessageId;
    }
    // get openMsgs() {
    //     if (this.recentMsgs && this.recentOpenMsgs) {
    //         return [...this.recentMsgs, ...this.recentOpenMsgs].map(obj => {
    //             return {
    //                 ...obj,
    //                 date: new Date(obj['CreatedDate'])
    //             };
    //         }).sort((a, b) => {
    //             if (a.date && b.date) {
    //                 return a.date.getTime() - b.date.getTime();
    //             }
    //         })
    //     }
    // }

    // @wire(findRecentTicketMessages, { userId: '$userId' }) recentMsgs;
    // @wire(findRecentTicketMessages, { userId: '$userId' })
    // ticketSetup(result) {
    //     this.recentMsgKey = result;
    //     const { data, error } = result;
    //     if (data) {
    //         this.recentMsgs = JSON.parse(JSON.stringify(data));
    //         this.error = undefined;
    //     } else if (error) {
    //         this.recentMsgs = undefined;
    //         this.error = error;
    //         console.error(error);
    //     } else {
    //         this.error = undefined;
    //         this.recentMsgs = undefined;
    //     }
    //     this.lastSavedData = this.recentMsgs;
    //     this.isLoading = false;
    // }
    @wire(MessageContext)
    messageContext;
    @wire(getUnreadTimelineMessages, { userId: '$userId' }) newMessages;
    @wire(findRecentOpenThreadTicketMessages, {
        userId: '$userId'
    }) 
    threadSetup(result) {
        this.recentMsgKey = result;
        const { data, error } = result;
        if (data) {
            console.log("reg: "+JSON.stringify(data));
            this.recentMsgs = JSON.parse(JSON.stringify(data));
            console.log(JSON.stringify(this.recentMsgs));
            // this.recentMsgs = data;
            this.error = undefined;
        } else if (error) {
            this.recentMsgs = undefined;
            this.error = error;
            console.error(JSON.stringify(error));
        } else {
            this.error = undefined;
            this.recentMsgs = undefined;
        }
        this.lastSavedData = this.recentMsgs;
        this.isLoading = false;
    }    
    @wire(findRecentOpenTicketMessages, { userId: '$userId' })
    notificationSetup(result) {
        this.recentOpenMsgKey = result;
        const { data, error } = result;
        if (data) {
            console.log("Open: "+JSON.stringify(data));
            this.recentOpenMsgs = JSON.parse(JSON.stringify(data));
            console.log(JSON.stringify(this.recentOpenMsgs));
            // this.recentOpenMsgs = data;
            this.error = undefined;
        } else if (error) {
            this.recentOpenMsgs = undefined;
            this.error = error;
            console.error(error);
        } else {
            this.error = undefined;
            this.recentOpenMsgs = undefined;
        }
        this.lastSavedOpenData = this.recentOpenMsgs;
        this.isLoading = false; 
        this.setOpenMsgs();
    }
    // @wire(getRecordMembers, { ticketId: '$recordId', objectName: '$objectName' })
    // memberSetup(result) {
    //     this.membersKey = result;
    //     const { data, error } = result;
    //     if (data) {
    //         this.ticketUsers = JSON.parse(JSON.stringify(data));
    //         this.error = undefined;
    //     } else if (error) {
    //         this.ticketUsers = undefined;
    //         this.error = error;
    //         console.error(error);
    //     } else {
    //         this.error = undefined;
    //         this.ticketUsers = undefined;
    //     }
    //     this.lastSavedRecordData = this.ticketUsers;
    //     this.isLoading = false;
    //     this.setOpenMsgs();
    // }
    @wire(getReadUsers, { ticketMessageId: '$ticketMessageId' })
    userSetup(result) {
        this.ticketSeenUsers = result;
        const { data, error } = result;
        if (data) {
            this.ticketUsers = JSON.parse(JSON.stringify(data));
            this.error = undefined;
        } else if (error) {
            this.ticketUsers = undefined;
            this.error = error;
            console.error(JSON.stringify(error));
        } else {
            this.error = undefined;
            this.ticketUsers = undefined;
        }
        this.lastSavedUserData = this.ticketUsers;
        this.isLoading = false;
    };
    // @wire(getTicketMembers, { ticketId: '$recordId' })
    // ticketMemberSetup(result) {
    //     this.ticketMembersKey = result;
    //     const { data, error } = result;
    //     if (data) {
    //         this.ticketMembers = JSON.parse(JSON.stringify(data));
    //         this.error = undefined;
    //     } else if (error) {
    //         this.ticketMembers = undefined;
    //         this.error = error;
    //         console.error(error);
    //     } else {
    //         this.error = undefined;
    //         this.ticketMembers = undefined;
    //     }
    //     this.ticketUsers = {
    //         data: this.ticketMembers
    //     }
    //     this.isLoading = false;
    // }
    // @wire(getSetupMembers, { ticketId: '$recordId' })
    // setupMemberSetup(result) {
    //     this.setupMembersKey = result;
    //     const { data, error } = result;
    //     if (data) {
    //         this.setupMembers = JSON.parse(JSON.stringify(data));
    //         this.error = undefined;
    //     } else if (error) {
    //         this.setupMembers = undefined;
    //         this.error = error;
    //         console.error(error);
    //     } else {
    //         this.error = undefined;
    //         this.setupMembers = undefined;
    //     }
    //     // this.ticketUsers.data = this.setupMembers;
    //     this.isLoading = false;
    // }
    // @wire(getCashRequestMembers, { ticketId: '$recordId' })
    // cashMemberSetup(result) {
    //     this.cashRequestMembersKey = result;
    //     const { data, error } = result;
    //     if (data) {
    //         this.cashRequestMembers = JSON.parse(JSON.stringify(data));
    //         this.error = undefined;
    //     } else if (error) {
    //         this.cashRequestMembers = undefined;
    //         this.error = error;
    //         console.error(error);
    //     } else {
    //         this.error = undefined;
    //         this.cashRequestMembers = undefined;
    //     }
    //     // this.ticketUsers.data = this.cashRequestMembers;
    //     this.isLoading = false;
    // }    
    // @wire(getTicketMembers, {ticketId: '$recordId'}) ticketMembers;
    // @wire(getSetupMembers, {ticketId: '$recordId'}) setupMembers;
    // @wire(getCashRequestMembers, {ticketId: '$recordId'}) cashRequestMembers;


    connectedCallback() {
        this.showAll = false;
        this.mainArea = true;
        // this.setOpenMsgs();
        this.registerErrorListener();
        this.handleSubscribe();
        this.subscribeToMessageChannel();
        // this.getSetups();
    }

    disconnectedCallback() {
        this.unsubscribeToMessageChannel();
    }
    unsubscribeToMessageChannel() {
        unsub(this.subscription);
        this.subscription = null;
    } 
    // TODO Change publish behavior below to remove read messages clicked from Respond to UI event by publishing message
    // handleEditSelect(event) {
    //     const payload = { recordId: event.target.message.Id };

    //     publish(this.messageContext, TRADINGDESKMESSAGE, payload);
    // }
    subscribeToMessageChannel() {
        this.subscription = sub(
            this.messageContext,
            TRADINGDESKMESSAGE,
            (message) => this.handleMessage(message)
        );
    }
    handleMessage(message) {
        console.log(message);
        console.log('Tes');
        if (message.source === 'New_Account_Setup__c') {
            console.log('hub');
            let tempId = message.Id;
            getSingleNas({ nasId: tempId })
                .then(result => {
                    console.log(result);
                    let tempRes = result;
                    const message = {
                        Id: tempRes.Id,
                        Financial_Account_Name__c: tempRes.Financial_Account_Name__c
                    }
                    console.log('message: ' + JSON.stringify(message));
                    this.openTimelineView(message);
                }).catch(err => {
                    console.log('error: ' + err);
                })
        }
    }
    // Respond to UI event by publishing message
    handleOpenTimeline(event) {
        // const payload = {
        //     recordId: event.detail.recordId,
        //     source: event.detail.source
        // };
        console.log(JSON.stringify(event.detail));
        console.log(JSON.stringify(event.detail.source));
        this.messageSource = event.detail.source;
        this.recordId = event.detail.id;
        this.mainArea = false;
        this.ticketMsg = event.detail.ticketMsg;
        this.timelineTitle = event.detail.preview;
        // this.modalHeader = 'Add To Message Thread...';
        return refreshApex(this.ticketSeenUsers);
        // publish(this.messageContext, TRADINGDESKMESSAGE, payload);
    }  
    openModal(event) {
        this.isModalOpen = true;
        this.mainArea = false;
        this.ticketMessageId = event.detail.id;
        this.ticketMsg = event.detail.ticketMsg;
        this.modalHeader = 'Add To Message Thread...';
        refreshApex(this.ticketSeenUsers);
    }
    closeModal() {
        this.isModalOpen = false;
    }      
    setOpenMsgs() {
        // console.log("Open1: ",typeof this.recentMsgs, " ", JSON.stringify(this.recentMsgs));
        // console.log("Open2: ", typeof this.recentOpenMsgs, " ", JSON.stringify(this.recentOpenMsgs));
        if (this.recentMsgs && this.recentOpenMsgs) {
            const tempOpenMsgs = [...this.recentMsgs, ...this.recentOpenMsgs];
            this.openMsgs = tempOpenMsgs.map(obj => {
                return {
                    ...obj,
                    date: new Date(obj['CreatedDate'])
                };
            }).sort((a, b) => {
                if (a.date && b.date) {
                    return b.date.getTime() - a.date.getTime();
                }
                return 0;
            });
            this.numNewMsgs = tempOpenMsgs.length;
        }

        // mergedObj = {};

        // for (const key in this.recentMsgs) {
        // const item = obj1[key];
        // this.mergedObj[key] = {
        //     ...item,
        //     date: new Date(item.CreatedDate),
        // };
        // }

        // for (const key in this.recentOpenMsgs) {
        // const item = obj2[key];
        // this.mergedObj[key] = {
        //     ...item,
        //     date: new Date(item.CreatedDate),
        // };
        // }

        // this.openMsgs = Object.values(this.mergedObj).sort((a, b) => {
        // if (a.date && b.date) {
        //     return a.date.getTime() - b.date.getTime();
        // }
        // return 0;
        // });
    }
    showAllMsgs() {
        this.isLoading = true;
        this.showAll = true;
        this.pageTitle = 'All Timeline Messages';
        this.isLoading = false;
    }
    showOpenMsgs() {
        this.showAll = false;
        this.pageTitle = 'Open Timeline Messages';
    }
    toggleSearch() {
        this.showSearch = !this.showSearch;
    }
    handleUserSuccess(event) {
        return refreshApex(this.membersKey);
    }
    openTimelineView(event) {
        this.isLoading = true;
        // this.recordId = event.detail.id;
        // this.timelineTitle = event.detail.preview;
        const source = event.detail.source;
        // if (source === 'Message Thread') {
        //     this.handleOpenThread(event);
        // } else {
        //     this.handleOpenTimeline(event);
        // }
        // console.log(this.cashRequestMembers);
        // if (source === 'Raise Cash' || source === 'Account Setup' || source === 'Help Desk') {
        //     switch (source) {
        //         case 'Raise Cash':
        //             this.userTitle = 'Cash Request Members';
        //             this.showMembers = true;
        //             this.showCustom = false;
        //             this.isLoading = false;
        //             this.mainArea = false;
        //             this.objectName = 'raiseCash';
        //             refreshApex(this.membersKey);
        //             break;
        //         case 'Account Setup':
        //             this.userTitle = 'Setup Members';
        //             this.showMembers = true;
        //             this.showCustom = false;
        //             this.isLoading = false;
        //             this.mainArea = false;
        //             this.objectName = 'acctSetup';
        //             refreshApex(this.membersKey);
        //             break;
        //         case 'Help Desk':
        //             this.userTitle = 'Ticket Members';
        //             this.showMembers = true;
        //             this.showCustom = false;
        //             this.isLoading = false;
        //             this.mainArea = false;
        //             this.objectName = 'helpDesk';
        //             refreshApex(this.membersKey);
        //             break;
        //         default:
        //             this.isLoading = false;
        //             break;
        //     }
        // } else {
        //     this.showMembers = false;
        //     this.showCustom = true;
        //     this.isLoading = false;
        //     this.mainArea = false;
        // }
    }
    markAllRead() {
        this.isLoading = true;
        markAllRead({userId: this.userId})
            .then(result => {
                this.isLoading = false;
                console.log(result);
                this.connectedCallback();
            }
        )
            .catch(error => {
                this.isLoading = false;
                console.log(error);
            }
        );
    }
    goBack() {
        console.log('refresh notifications list');
        refreshApex(this.newMessages);
        refreshApex(this.recentMsgKey);
        refreshApex(this.recentOpenMsgKey);
        this.connectedCallback();
    }

    handleTimelineView(event) {
        this.showTimeline = true;
        console.log(event.detail);
        this.recordId = event.detail.id;
        const el = this.template.querySelector('c-chat-timeline');
        el.refreshTimelinePosts(event.detail.id);
    }
    handleSearch(event) {
        const searchKey = event.target.value.toLowerCase();
        console.log( 'Search String is ' + searchKey );
        if ( searchKey ) {
            this.recentMsgs = this.lastSavedData;
            // console.log( 'Tickets Records are ' + JSON.stringify( this.recentMsgs ) );
            if ( this.recentMsgs ) {
                let recs = [];
                for ( let rec of this.recentMsgs ) {
                    // console.log( 'Rec is ' + JSON.stringify( rec ) );
                    let valuesArray = Object.values( rec );
                    // console.log( 'valuesArray is ' + JSON.stringify( valuesArray ) );
                    for ( let val of valuesArray ) {
                        // console.log( 'val is ' + val );
                        let strVal = String( val );
                        if ( strVal ) {
                            if ( strVal.toLowerCase().includes( searchKey ) ) {
                                recs.push( rec );
                                break;
                            }
                        }
                    }
                }
                // console.log( 'Matched Accounts are ' + JSON.stringify( recs ) );
                this.recentMsgs = recs;
             }
        }  else {
            this.recentMsgs = this.lastSavedData;
        }        
    }  
    handleOpenSearch(event) {
        const searchKey = event.target.value.toLowerCase();
        console.log( 'Search String is ' + searchKey );
        if ( searchKey ) {
            this.recentOpenMsgs.data = this.lastSavedOpenData;
            // console.log( 'Tickets Records are ' + JSON.stringify( this.recentMsgs ) );
            if ( this.recentOpenMsgs ) {
                let recs = [];
                for ( let rec of this.recentOpenMsgs ) {
                    // console.log( 'Rec is ' + JSON.stringify( rec ) );
                    let valuesArray = Object.values( rec );
                    // console.log( 'valuesArray is ' + JSON.stringify( valuesArray ) );
                    for ( let val of valuesArray ) {
                        // console.log( 'val is ' + val );
                        let strVal = String( val );
                        if ( strVal ) {
                            if ( strVal.toLowerCase().includes( searchKey ) ) {
                                recs.push( rec );
                                break;
                            }
                        }
                    }
                }
                // console.log( 'Matched Accounts are ' + JSON.stringify( recs ) );
                this.recentOpenMsgs = recs;
             }
        }  else {
            this.recentOpenMsgs = this.lastSavedOpenData;
        }        
    }  
    handleSubscribe() {
        // Callback invoked whenever a new event message is received
        const messageCallback = (response) => {
            console.log('New message received: ', JSON.stringify(response));
            refreshApex(this.recentMsgKey);
            refreshApex(this.recentOpenMsgKey);
            refreshApex(this.newMessages);
            // let updatedTicketId = response.data.payload.TicketId__c;
        };

        // Invoke subscribe method of empApi. Pass reference to messageCallback
        subscribe('/event/Help_Desk_Message__e', -1, messageCallback).then((response) => {
            // Response contains the subscription information on subscribe call
            console.log(
                'Subscription request sent to: ',
                JSON.stringify(response)
            );
            this.subscription = response;
            //this.toggleSubscribeButton(true);
        });
    }
    registerErrorListener() {
        // Invoke onError empApi method
        onError((error) => {
            console.log('Received error from server: ', JSON.stringify(error));
            // Error contains the server-side error
        });
    }     
}