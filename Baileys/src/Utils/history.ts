import { promisify } from 'util'
import { inflate } from 'zlib'
import { proto } from '../../WAProto'
import { Chat, Contact, InitialReceivedChatsState } from '../Types'
import { isJidUser } from '../WABinary'
import { toNumber } from './generics'
import { normalizeMessageContent } from './messages'
import { downloadContentFromMessage } from './messages-media'

const inflatePromise = promisify(inflate)

export const downloadHistory = async(msg: proto.Message.IHistorySyncNotification) => {
	const stream = await downloadContentFromMessage(msg, 'history')
	let buffer = Buffer.from([])
	for await (const chunk of stream) {
		buffer = Buffer.concat([buffer, chunk])
	}

	// decompress buffer
	buffer = await inflatePromise(buffer)

	const syncData = proto.HistorySync.decode(buffer)
	return syncData
}

export const processHistoryMessage = (
	item: proto.IHistorySync,
	historyCache: Set<string>,
	recvChats: InitialReceivedChatsState
) => {
	const messages: proto.IWebMessageInfo[] = []
	const contacts: Contact[] = []
	const chats: Chat[] = []

	switch (item.syncType) {
	case proto.HistorySync.HistorySyncType.INITIAL_BOOTSTRAP:
	case proto.HistorySync.HistorySyncType.RECENT:
		for(const chat of item.conversations!) {
			const contactId = `c:${chat.id}`
			if(chat.name && !historyCache.has(contactId)) {
				contacts.push({ id: chat.id, name: chat.name })
				historyCache.add(contactId)
			}

			const msgs = chat.messages || []
			for(const item of msgs) {
				const message = item.message!
				const uqId = `${message.key.remoteJid}:${message.key.id}`
				if(!historyCache.has(uqId)) {
					messages.push(message)

					const curItem = recvChats[message.key.remoteJid!]
					const timestamp = toNumber(message.messageTimestamp)
					if(!message.key.fromMe && (!curItem || timestamp > curItem.lastMsgRecvTimestamp)) {
						recvChats[chat.id] = { lastMsgRecvTimestamp: timestamp }
						// keep only the most recent message in the chat array
						chat.messages = [{ message }]
					}

					historyCache.add(uqId)
				}
			}

			if(!historyCache.has(chat.id)) {
				if(isJidUser(chat.id) && chat.readOnly && chat.archived) {
					chat.readOnly = false
				}

				chats.push(chat)
				historyCache.add(chat.id)
			}
		}

		break
	case proto.HistorySync.HistorySyncType.PUSH_NAME:
		for(const c of item.pushnames!) {
			const contactId = `c:${c.id}`
			if(!historyCache.has(contactId)) {
				contacts.push({ notify: c.pushname!, id: c.id! })
				historyCache.add(contactId)
			}
		}

		break
	case proto.HistorySync.HistorySyncType.INITIAL_STATUS_V3:
		// TODO
		break
	}

	const didProcess = !!(chats.length || messages.length || contacts.length)

	return {
		chats,
		contacts,
		messages,
		didProcess,
	}
}

export const downloadAndProcessHistorySyncNotification = async(
	msg: proto.Message.IHistorySyncNotification,
	historyCache: Set<string>,
	recvChats: InitialReceivedChatsState
) => {
	const historyMsg = await downloadHistory(msg)
	return processHistoryMessage(historyMsg, historyCache, recvChats)
}

export const isHistoryMsg = (message: proto.IMessage) => {
	const normalizedContent = !!message ? normalizeMessageContent(message) : undefined
	const isAnyHistoryMsg = !!normalizedContent?.protocolMessage?.historySyncNotification

	return isAnyHistoryMsg
}