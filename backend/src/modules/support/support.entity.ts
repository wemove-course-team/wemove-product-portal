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

export enum ManualAccessLevel {
    PUBLIC = 'public',
    REGISTERED = 'registered',
}

@Entity('support_messages')
export class SupportMessage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index({ unique: true })
    @Column({ type: 'varchar', length: 32 })
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

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

@Entity('support_faqs')
export class SupportFaq {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ type: 'varchar', length: 50 })
    category: string;

    @Column({ type: 'varchar', length: 255 })
    question: string;

    @Column({ type: 'text' })
    answer: string;

    @Column({ type: 'int', default: 0 })
    sortOrder: number;

    @Column({ type: 'boolean', default: true })
    isPublished: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

@Entity('support_manuals')
export class SupportManual {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'varchar', length: 500 })
    fileUrl: string;

    @Column({ type: 'int', comment: 'File size in bytes' })
    fileSize: number;

    @Column({
        type: 'enum',
        enum: ManualAccessLevel,
        default: ManualAccessLevel.PUBLIC,
    })
    accessLevel: ManualAccessLevel;

    @Column({ type: 'boolean', default: true })
    isPublished: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}