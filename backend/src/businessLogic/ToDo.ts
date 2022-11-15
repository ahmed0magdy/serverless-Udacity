import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { TodosAccess } from '../dataLayer/ToDoAccess'
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
import { TodoUpdate } from '../models/TodoUpdate';

const XAWS = AWSXRay.captureAWS(AWS)

// TODO: Implement the fileStogare logic
const s3BucketName = process.env.ATTACHMENT_S3_BUCKET
const urlExpiration = 300

export class AttachmentUtils{
    constructor(
        private readonly s3 = new XAWS.S3({ signatureVersion: 'v4' }),
        private readonly bucketName = s3BucketName
    ) {}

    getAttachmentUrl(todoId: string) {
        return `https://${this.bucketName}.s3.amazonaws.com/${todoId}`
    }

    getUploadUrl(todoId: string): string {
        console.log('getUploadUrl called')
        const url = this.s3.getSignedUrl('putObject', {
            Bucket: this.bucketName,
            Key: todoId,
            Expires: urlExpiration
        })
        return url as string
    }
}

// TODO: Implement businessLogic
const logger = createLogger('TodosAccess')
const attachmentUtils = new AttachmentUtils()
const todosAccess = new TodosAccess()

// Write get todos function
export async function getTodosForUser(userId: string): Promise<TodoItem[]> {
    logger.info('Get todos for user function called')
    return todosAccess.getAllTodos(userId)
}

// Write create todo function
export async function createTodo(
  newTodo: CreateTodoRequest,
  userId: string
): Promise<TodoItem> {
  logger.info('Create todo function called')

  const todoId = uuid.v4()
  const createdAt = new Date().toISOString()
  const s3AttachmentUrl = attachmentUtils.getAttachmentUrl(todoId)
  const newItem = {
    userId,
    todoId,
    createdAt,
    done: false,
    attachmentUrl: s3AttachmentUrl,
    ...newTodo
  }

  return await todosAccess.createTodoItem(newItem)
}

// Write update todo function
export async function updateTodo(
    todoId: string,
    todoUpdate: UpdateTodoRequest,
    userId: string
    ): Promise<TodoUpdate> {
    logger.info('Update todo function called')
    return todosAccess.updateTodoItem(todoId, userId, todoUpdate)
}

// Write delete todo function
export async function deleteTodo(
    todoId: string,
    userId: string
    ): Promise<string> {
    logger.info('Delete todo function called')
    return todosAccess.deleteTodoItem(todoId, userId)
}

// Write create attachment function
export async function createAttachmentPresignedUrl(
    todoId: string,
    userId: string
    ): Promise<string> {
    logger.info('Create attachment function called by user', userId, todoId)
    return attachmentUtils.getUploadUrl(todoId)
}