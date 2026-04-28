import { api } from '../../transactions/api/transactionApi'

export const cloudinaryApi = {
  // Upload payment proof via backend API
  async uploadPaymentProof(
    file: File,
    _userId: number,
    transactionId: number
  ): Promise<string> {
    const formData = new FormData()
    formData.append('paymentProof', file)

    const response = await api.put(`/transactions/${transactionId}/payment-proof`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    if (!response.data.success) {
      throw new Error(response.data.message || 'Upload failed')
    }

    return response.data.data.paymentProofUrl
  },

  // Upload event image via backend API
  async uploadEventImage(
    file: File,
    _organizerId: number,
    eventId: number
  ): Promise<string> {
    const formData = new FormData()
    formData.append('image', file)

    const response = await api.post(`/organizer/events/${eventId}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    if (!response.data.success) {
      throw new Error(response.data.message || 'Upload failed')
    }

    return response.data.data.imageUrl
  },
}
