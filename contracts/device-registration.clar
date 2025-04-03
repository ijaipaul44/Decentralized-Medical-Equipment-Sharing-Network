;; Device Registration Contract
;; Records details of specialized medical equipment

(define-data-var last-device-id uint u0)

;; Device status: 0 = inactive, 1 = active, 2 = maintenance
(define-map devices
  { device-id: uint }
  {
    name: (string-ascii 100),
    description: (string-ascii 500),
    owner: principal,
    status: uint,
    hourly-rate: uint,
    registration-date: uint
  }
)

;; Register a new medical device
(define-public (register-device (name (string-ascii 100)) (description (string-ascii 500)) (hourly-rate uint))
  (let
    (
      (new-id (+ (var-get last-device-id) u1))
    )
    (asserts! (is-eq tx-sender contract-caller) (err u403))
    (var-set last-device-id new-id)
    (map-set devices
      { device-id: new-id }
      {
        name: name,
        description: description,
        owner: tx-sender,
        status: u1,
        hourly-rate: hourly-rate,
        registration-date: block-height
      }
    )
    (ok new-id)
  )
)

;; Update device status (active, maintenance, inactive)
(define-public (update-device-status (device-id uint) (new-status uint))
  (let
    (
      (device (unwrap! (map-get? devices { device-id: device-id }) (err u404)))
    )
    (asserts! (is-eq (get owner device) tx-sender) (err u403))
    (asserts! (<= new-status u2) (err u400))
    (map-set devices
      { device-id: device-id }
      (merge device { status: new-status })
    )
    (ok true)
  )
)

;; Get device details
(define-read-only (get-device (device-id uint))
  (map-get? devices { device-id: device-id })
)

;; Check if device is available
(define-read-only (is-device-available (device-id uint))
  (match (map-get? devices { device-id: device-id })
    device (is-eq (get status device) u1)
    false
  )
)

;; Get device owner
(define-read-only (get-device-owner (device-id uint))
  (match (map-get? devices { device-id: device-id })
    device (some (get owner device))
    none
  )
)

