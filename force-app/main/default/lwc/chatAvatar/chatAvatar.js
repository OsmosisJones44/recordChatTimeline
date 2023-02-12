import { LightningElement, api } from 'lwc';

export default class ChatAvatar extends LightningElement {
    @api photo;
    @api size;
    @api containerClass = '';
}