'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import {
  getResources,
  saveResource,
  updateResource,
  deleteResource
} from '../../lib/storage'

export default function ResourceMasterPage() {

  const [resources, setResources] = useState([])

  const [resourceName, setResourceName] =
    useState('')

  const [hoursPerDay, setHoursPerDay] =
    useState('8')

  const [manHourRate, setManHourRate] =
    useState('')

  const [currency, setCurrency] =
    useState('SEK')

  const [active, setActive] =
    useState(true)

  const [editingId, setEditingId] =
    useState(null)

  // Filters
  const [filterResource, setFilterResource] =
    useState('')

  const [filterCurrency, setFilterCurrency] =
    useState('')

  useEffect(() => {
    loadData()
  }, [])

  function loadData() {
    setResources(getResources())
  }

  function clearForm() {

    setResourceName('')
    setHoursPerDay('8')
    setManHourRate('')
    setCurrency('SEK')
    setActive(true)

    setEditingId(null)
  }

  function clearFilters() {

    setFilterResource('')
    setFilterCurrency('')
  }

  function handleSave() {

    if (!resourceName.trim()) {
      alert('Please enter Resource Name')
      return
    }

    if (!manHourRate) {
      alert('Please enter Man Hour Rate')
      return
    }

    const record = {
      id: editingId || Date.now(),

      resourceName:
        resourceName.trim(),

      hoursPerDay:
        Number(hoursPerDay),

      manHourRate:
        Number(manHourRate),

      currency,

      active
    }

    if (editingId) {

      updateResource(
        editingId,
        record
      )

    } else {

      saveResource(record)
    }

    loadData()
    clearForm()
  }

  function handleEdit(resource) {

    setEditingId(resource.id)

    setResourceName(
      resource.resourceName
    )

    setHoursPerDay(
      resource.hoursPerDay
    )

    setManHourRate(
      resource.manHourRate
    )

    setCurrency(
      resource.currency
    )

    setActive(
      resource.active
    )
  }

  function handleDelete(id) {

    if (
      !confirm(
        'Delete this resource?'
      )
    ) {
      return
    }

    deleteResource(id)

    loadData()
  }

  const filteredResources =
    resources.filter((resource) => {

      return (

        (!filterResource ||

          resource.resourceName
            .toLowerCase()
            .includes(
              filterResource
                .toLowerCase()
            )) &&

        (!filterCurrency ||

          resource.currency ===
            filterCurrency)
      )
    })

  return (
    <div
      style={{
        padding: 20,
        fontFamily: 'Arial'
      }}
    >

      <h1>
        Resource Master
      </h1>

      {/* Navigation */}

      <div
        style={{
          marginBottom: 20
        }}
      >

        <Link href="/">
          <button>
            Dashboard
          </button>
        </Link>

        <Link
          href="/add-budget"
          style={{
            marginLeft: 10
          }}
        >
          <button>
            Budget
          </button>
        </Link>

        <Link
          href="/add-expense"
          style={{
            marginLeft: 10
          }}
        >
          <button>
            Expense
          </button>
        </Link>

        <Link
          href="/forex-rates"
          style={{
            marginLeft: 10
          }}
        >
          <button>
            Forex Rates
          </button>
        </Link>

        <Link
          href="/projections"
          style={{
            marginLeft: 10
          }}
        >
          <button>
            Projection
          </button>
        </Link>

      </div>

      <hr />

      <h2>
        Add Resource
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(2, 300px)',
          gap: 10,
          marginBottom: 20
        }}
      >

        <input
          placeholder="Resource Name"
          value={resourceName}
          onChange={(e) =>
            setResourceName(
              e.target.value
            )
          }
        />

        <input
          type="number"
          step="0.25"
          placeholder="Hours Per Day"
          value={hoursPerDay}
          onChange={(e) =>
            setHoursPerDay(
              e.target.value
            )
          }
        />

        <input
          type="number"
          step="0.01"
          placeholder="Man Hour Rate"
          value={manHourRate}
          onChange={(e) =>
            setManHourRate(
              e.target.value
            )
          }
        />

        <select
          value={currency}
          onChange={(e) =>
            setCurrency(
              e.target.value
            )
          }
        >
          <option>
            SEK
          </option>

          <option>
            USD
          </option>

          <option>
            EUR
          </option>

          <option>
            INR
          </option>
        </select>

        <label>

          <input
            type="checkbox"
            checked={active}
            onChange={(e) =>
              setActive(
                e.target.checked
              )
            }
          />

          {' '}
          Active

        </label>

      </div>

      <button
        onClick={handleSave}
      >
        {editingId
          ? 'Update Resource'
          : 'Save Resource'}
      </button>

      <hr />

      <h2>
        Filters
      </h2>

      <div
        style={{
          display: 'flex',
          gap: 10,
          marginBottom: 20
        }}
      >

        <input
          placeholder="Search Resource"
          value={filterResource}
          onChange={(e) =>
            setFilterResource(
              e.target.value
            )
          }
        />

        <select
          value={filterCurrency}
          onChange={(e) =>
            setFilterCurrency(
              e.target.value
            )
          }
        >
          <option value="">
            All Currencies
          </option>

          <option>
            SEK
          </option>

          <option>
            USD
          </option>

          <option>
            EUR
          </option>

          <option>
            INR
          </option>
        </select>

        <button
          onClick={clearFilters}
        >
          Clear Filter
        </button>

      </div>

      <hr />

      <h2>
        Saved Resources
        {' '}
        (
        {filteredResources.length}
        )
      </h2>

      <table
        border="1"
        cellPadding="8"
        style={{
          borderCollapse:
            'collapse',
          width: '100%'
        }}
      >

        <thead>
          <tr>
            <th>
              Resource
            </th>

            <th>
              Hours / Day
            </th>

            <th>
              Man Hour Rate
            </th>

            <th>
              Currency
            </th>

            <th>
              Active
            </th>

            <th>
              Actions
            </th>
          </tr>
        </thead>

        <tbody>

          {filteredResources.map(
            (resource) => (

              <tr
                key={resource.id}
              >

                <td>
                  {
                    resource.resourceName
                  }
                </td>

                <td>
                  {
                    resource.hoursPerDay
                  }
                </td>

                <td>
                  {
                    resource.manHourRate
                  }
                </td>

                <td>
                  {
                    resource.currency
                  }
                </td>

                <td>
                  {
                    resource.active
                      ? 'Yes'
                      : 'No'
                  }
                </td>

                <td>

                  <button
                    onClick={() =>
                      handleEdit(
                        resource
                      )
                    }
                  >
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      handleDelete(
                        resource.id
                      )
                    }
                    style={{
                      marginLeft: 5
                    }}
                  >
                    Delete
                  </button>

                </td>

              </tr>
            )
          )}

        </tbody>

      </table>

    </div>
  )
}
