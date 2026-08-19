"""Payment routes (initiate, verify, status)."""

from fastapi import APIRouter

from app.schemas.common import APIResponse
from app.schemas.payment import (
    PaymentInitiateRequest,
    PaymentInitiateResponse,
    PaymentOut,
)
from app.security.dependencies import CurrentUser, DbDep
from app.services import payment_service

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post(
    "/initiate",
    response_model=APIResponse[PaymentInitiateResponse],
    summary="Initiate a payment for an order",
    description="Creates a payment record and starts the chosen provider flow (JazzCash / "
    "EasyPaisa / COD). For gateway methods the response contains a `redirect_url` "
    "that the frontend must send the customer to.",
    responses={
        200: {"description": "Payment initiated. Check redirect_url."},
        404: {"description": "Order not found or not owned by caller."},
        422: {"description": "Order is cancelled/delivered or already paid."},
    },
)
async def initiate_payment(data: PaymentInitiateRequest, user: CurrentUser, db: DbDep):
    payment, result = await payment_service.initiate_payment(db, user.id, data)
    return APIResponse(
        success=True,
        message="Payment initiated.",
        data=PaymentInitiateResponse(
            payment_id=payment.id,
            order_id=payment.order_id,
            order_number=payment.order.order_number,
            amount=payment.amount,
            currency=payment.currency,
            provider=payment.provider,
            status=payment.status,
            provider_reference=payment.provider_reference,
            redirect_url=result.redirect_url if result else None,
        ),
    )


@router.get(
    "/{payment_id}",
    response_model=APIResponse[PaymentOut],
    summary="Get payment status",
    description="Returns the current status of a payment. Customers can only view their own.",
)
async def get_payment(payment_id: int, user: CurrentUser, db: DbDep):
    payment = await payment_service.get_payment(db, payment_id, customer_id=user.id)
    return APIResponse(success=True, data=PaymentOut.model_validate(payment))


@router.post(
    "/{payment_id}/verify",
    response_model=APIResponse[PaymentOut],
    summary="Verify a payment against the provider",
    description="Polls the provider (where a status API exists) and updates the payment and "
    "order accordingly. Safe to call repeatedly.",
)
async def verify_payment(payment_id: int, user: CurrentUser, db: DbDep):
    await payment_service.get_payment(db, payment_id, customer_id=user.id)
    payment = await payment_service.verify_payment(db, payment_id)
    return APIResponse(success=True, data=PaymentOut.model_validate(payment))
