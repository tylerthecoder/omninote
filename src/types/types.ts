export type Plan = {
    id: string;
    day: string;
    createdAt: string;
    updatedAt: string;
    text: string;
}

export type Todo = {
    id: string;
    text: string;
    completed: boolean;
    createdAt: string;
    updatedAt: string;
}

export type BuyListItem = {
    id: string;
    text: string;
    completed: boolean;
    url?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export type TalkNote = {
    id: string;
    title: string;
    content: string;
    speaker: string;
    date: string;
    createdAt: string;
    updatedAt: string;
}


