import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

export enum MessageStatus {
    PENDING = 'pending',
    PROCESSED = 'processed',
}

export enum ManualVisibility {
    PUBLIC = 'PUBLIC',
    USER = 'USER',
    DEALER = 'DEALER',
}

@Entity('support_messages')
export class SupportMessage {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Index({ unique: true })
    @Column({ name: 'ticket_no', type: 'varchar', length: 32 })
    ticketNo: string;

    @Column({ type: 'varchar', length: 100 })
    name: string;

    @Index()
    @Column({ type: 'varchar', length: 255 })
    email: string;

    @Column({ type: 'varchar', length: 255 })
    subject: string;

    @Column({ type: 'text' })
    content: string;

    @Column({
        type: 'enum',
        enum: MessageStatus,
        default: MessageStatus.PENDING,
    })
    status: MessageStatus;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}

@Entity('support_faqs')
export class SupportFaq {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Index()
    @Column({ type: 'varchar', length: 50 })
    category: string;

    @Column({ type: 'varchar', length: 255 })
    question: string;

    @Column({ type: 'text' })
    answer: string;

    @Column({ name: 'sort_order', type: 'int', default: 0 })
    sortOrder: number;

    @Column({ name: 'is_published', type: 'boolean', default: true })
    isPublished: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}

@Entity('support_manuals')
export class SupportManual {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ name: 'file_url', type: 'varchar', length: 500 })
    fileUrl: string;

    @Column({ name: 'file_size', type: 'int', comment: 'File size in bytes' })
    fileSize: number;

    @Index()
    @Column({
        type: 'enum',
        enum: ManualVisibility,
        default: ManualVisibility.PUBLIC,
    })
    visibility: ManualVisibility;

    @Column({ name: 'is_published', type: 'boolean', default: true })
    isPublished: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}