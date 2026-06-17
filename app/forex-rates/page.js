'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import {
  getForexRates,
  saveForexRate,
  deleteForexRate,
  updateForexRate
} from '../../lib/storage'

export default function ForexRates() {

  const [currency, setCurrency] = useState('')
  const [rate, setRate] = useState('')

  const [rates, setRates] = useState([])

  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    loadRates()
  }, [])

  function loadRates() {
    setRates(getForexRates())
  }

  const handleSubmit = () => {

    if (!currency || !rate) {
      alert('Please fill all fields')
      return
    }

    saveForexRate({
      currency: currency.toUpperCase(),
      rate: Number(rate)
    })

    resetForm()
    loadRates()
  }

  const handleDelete = (id, currency) => {

    // Prevent deleting SEK
    if (currency === 'SEK') {
      alert('SEK cannot be deleted')
      return
    }

    if (!confirm('Delete this forex rate?')) return

    deleteForexRate(id)

    loadRates()
  }

  const handleEdit = (r) => {

    // Prevent editing SEK
    if (r.currency === 'SEK') {
      alert('SEK cannot be edited')
      return
    }

    setEditingId(r.id)

    setCurrency(r.currency)
    setRate(r.rate)
  }

  const handleUpdate = () => {

    updateForexRate({
      id: editingId,
      currency: currency.toUpperCase(),
      rate: Number(rate)
    })

    setEditingId(null)

    resetForm()
    loadRates()
  }

  const resetForm = () => {

    setCurrency('')
    setRate('')
  }

  return (
    <div style={{ padding: 20 }}>

      {/* Navigation */}
      <div style={{ marginBottom: 20 }}>

        <Link href="/">
          <button>Dashboard</button>
        </Link>

        <Link href="/add-budget" style={{ marginLeft: 10 }}>
          <button>Projected Spend</button>
        </Link>

        <Link href="/add-expense" style={{ marginLeft: 10 }}>
          <button>Expense Tracking</button>
        </Link>

        <Link href="/resource-master" style={{ marginLeft: 10 }}>
          <button>Resource Master</button>
        </Link>

        <Link href="/projections" style={{ marginLeft: 10 }}>
          <button>Projection Planning</button>
        </Link>
        
      </div>

      <h1>Forex Rates</h1>

      <p>
        Base Currency: <strong>SEK</strong>
      </p>

      <p>
        Example:
        <br />
        1 USD = 10.5 SEK
      </p>

      {/* Currency */}
      <input
        placeholder="Currency (USD)"
        value={currency}
        onChange={(e) =>
          setCurrency(e.target.value)
        }
      />

      <br /><br />

      {/* Rate */}
      <input
        type="number"
        step="0.0001"
        placeholder="Rate to SEK"
        value={rate}
        onChange={(e) =>
          setRate(e.target.value)
        }
      />

      <br /><br />

      {editingId ? (
        <button onClick={handleUpdate}>
          Update
        </button>
      ) : (
        <button onClick={handleSubmit}>
          Save
        </button>
      )}

      <hr style={{ margin: '30px 0' }} />

      <h2>Saved Forex Rates</h2>

      <table border="1" cellPadding="8">

        <thead>
          <tr>
            <th>Currency</th>
            <th>Rate to SEK</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>

          {rates.map((r) => (
            <tr key={r.id}>

              <td>{r.currency}</td>

              <td>{r.rate}</td>

              <td>

                {r.currency !== 'SEK' && (
                  <>
                    <button
                      onClick={() =>
                        handleEdit(r)
                      }
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        handleDelete(
                          r.id,
                          r.currency
                        )
                      }
                      style={{ marginLeft: 5 }}
                    >
                      Delete
                    </button>
                  </>
                )}

              </td>

            </tr>
          ))}

        </tbody>

      </table>
    </div>
  )
}
