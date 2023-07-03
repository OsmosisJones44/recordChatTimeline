import { LightningElement, track, api } from 'lwc';
import getInsightsFromApex from '@salesforce/apex/aiPromptController.getInsights';

export default class AiPrompter extends LightningElement {
    @api context;
    @api command;
    @api message;
    @track insightsText = '';

    get aiResult() {
        return this.insightsText;
    }

    connectedCallback() {
        this.context = this.context || '';
        this.command = this.command || 'tldr';
        this.getInsights();
    }

    async getInsights() {
        if (this.message > 0) {
            try {
                const response = await getInsightsFromApex({ formula: this.formulaContent, context: this.context, command: this.command });
                const jsonResponse = JSON.parse(response);
                const content = jsonResponse.choices[0].message.content;
                this.insightsText = content;
            } catch (error) {
                this.insightsText = '';
                console.error('Error with insights loading:', error.message);
            }
        } else {
            this.insightsText = '';
        }
    }
}