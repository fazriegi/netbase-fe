import { useState, useEffect } from "react";
import {
  Drawer,
  Form,
  Button,
  DatePicker,
  Select,
  Radio,
  Space,
  Input,
  Checkbox,
  App,
} from "antd";
import InputNumeric from "src/components/input/InputNumeric";
import api from "src/pkg/api";
import { formatRupiah } from "src/pkg/helper";
import dayjs from "dayjs";

export default function TransactionForm({
  open,
  onClose,
  transactionId,
  onSuccess,
}) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [originalTx, setOriginalTx] = useState(null);

  const [categories, setCategories] = useState([]);
  const [assets, setAssets] = useState([]);
  const [liabilities, setLiabilities] = useState([]);

  const [selectCategoryOpen, setSelectCategoryOpen] = useState(false);
  const [selectAssetOpen, setSelectAssetOpen] = useState(false);
  const [selectLiabilityOpen, setSelectLiabilityOpen] = useState(false);

  const [cashflowType, setCashflowType] = useState("income"); // "income" | "expense"
  const [linkType, setLinkType] = useState("none"); // "none" | "asset" | "liability"

  const selectedAssetId = Form.useWatch("asset_id", form);
  const selectedLiabilityId = Form.useWatch("liability_id", form);
  const currentAmount = Form.useWatch("amount", form);
  const shouldUpdateBalance = Form.useWatch("update_balance", form);

  const isExpense = cashflowType === "expense";
  const numAmount = Number(currentAmount || 0);

  // Original transaction baseline information (if editing an existing transaction)
  const oldAmount = Number(originalTx?.amount || 0);
  const oldIsExpense = originalTx?.category_type === "expense";
  const oldUpdateBalance =
    originalTx?.update_balance !== undefined
      ? Boolean(originalTx.update_balance)
      : true;

  // Asset balance calculation
  const selectedAsset = assets.find((a) => a.id === selectedAssetId);
  const assetCurrentVal = Number(selectedAsset?.current_value || 0);

  // Was this transaction originally linked to this asset AND updated its balance?
  const wasBalanceUpdatedForThisAsset = Boolean(
    originalTx &&
      oldUpdateBalance &&
      originalTx.asset_id &&
      originalTx.asset_id === selectedAssetId,
  );

  // Baseline asset value before original transaction effect
  // If the transaction did NOT update balance originally, baseline is simply the current DB value
  const baseAssetVal = wasBalanceUpdatedForThisAsset
    ? oldIsExpense
      ? assetCurrentVal - oldAmount
      : assetCurrentVal + oldAmount
    : assetCurrentVal;

  const estimatedNewBalance =
    shouldUpdateBalance !== false
      ? isExpense
        ? baseAssetVal + numAmount
        : baseAssetVal - numAmount
      : baseAssetVal;

  const diffAssetBalance = estimatedNewBalance - assetCurrentVal;

  // Liability balance calculation
  const selectedLiability = liabilities.find(
    (l) => l.id === selectedLiabilityId,
  );
  const liabRemainingVal = Number(
    selectedLiability?.remaining_balance ??
      selectedLiability?.principal_amount ??
      0,
  );

  // Was this transaction originally linked to this liability AND updated its balance?
  const wasBalanceUpdatedForThisLiability = Boolean(
    originalTx &&
      oldUpdateBalance &&
      originalTx.liability_id &&
      originalTx.liability_id === selectedLiabilityId,
  );

  // Baseline liability value before original transaction effect
  // If the transaction did NOT update balance originally, baseline is simply the current DB value
  const baseLiabVal = wasBalanceUpdatedForThisLiability
    ? oldIsExpense
      ? liabRemainingVal + oldAmount
      : liabRemainingVal - oldAmount
    : liabRemainingVal;

  const estimatedNewLiabilityBalance =
    shouldUpdateBalance !== false
      ? isExpense
        ? baseLiabVal - numAmount
        : baseLiabVal + numAmount
      : baseLiabVal;

  const diffLiabilityBalance =
    estimatedNewLiabilityBalance - liabRemainingVal;

  const fetchDropdowns = async () => {
    try {
      const [resCats, resAssets, resLiabs] = await Promise.all([
        api.get("/v1/transactions/categories"),
        api.get("/v1/assets?is_active=true"),
        api.get("/v1/liabilities?is_active=true"),
      ]);

      setCategories(resCats.data?.data || []);
      setAssets(resAssets.data?.data || []);
      setLiabilities(resLiabs.data?.data || []);
    } catch {
      message.error("Failed to load form dependencies");
    }
  };

  useEffect(() => {
    if (open) {
      form.resetFields();
      setLinkType("none");
      setCashflowType("income");
      setOriginalTx(null);
      fetchDropdowns();

      if (transactionId) {
        fetchTransaction();
      } else {
        form.setFieldsValue({
          transaction_date: dayjs(),
          update_balance: true,
        });
      }
    }
  }, [open, transactionId]);

  const fetchTransaction = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/v1/transactions/${transactionId}`);
      const data = res.data?.data;
      if (data) {
        setOriginalTx(data);
        let detectedLinkType = "none";
        if (data.asset_id) {
          detectedLinkType = "asset";
        } else if (data.liability_id) {
          detectedLinkType = "liability";
        }
        setLinkType(detectedLinkType);
        setCashflowType(data.category_type || "income");

        form.setFieldsValue({
          transaction_date: dayjs(data.transaction_date),
          category_id: data.category_id,
          amount: data.amount,
          notes: data.notes,
          asset_id: data.asset_id || undefined,
          liability_id: data.liability_id || undefined,
          update_balance:
            data.update_balance !== undefined
              ? Boolean(data.update_balance)
              : true,
        });
      }
    } catch {
      message.error("Failed to fetch transaction details");
      onClose();
    } finally {
      setLoading(false);
    }
  };



  const handleLinkTypeChange = (e) => {
    const val = e.target.value;
    setLinkType(val);
    if (val === "none") {
      form.setFieldsValue({ asset_id: undefined, liability_id: undefined });
    } else if (val === "asset") {
      form.setFieldsValue({
        liability_id: undefined,
        update_balance:
          originalTx?.asset_id
            ? Boolean(originalTx.update_balance)
            : true,
      });
    } else if (val === "liability") {
      form.setFieldsValue({
        asset_id: undefined,
        update_balance:
          originalTx?.liability_id
            ? Boolean(originalTx.update_balance)
            : true,
      });
    }
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const updateBalance =
        linkType !== "none" ? Boolean(values.update_balance) : false;

      const payload = {
        category_id: values.category_id,
        amount: values.amount,
        transaction_date: values.transaction_date.format("YYYY-MM-DD"),
        notes: values.notes || null,
        asset_id: linkType === "asset" ? values.asset_id : null,
        liability_id: linkType === "liability" ? values.liability_id : null,
        update_balance: updateBalance,
      };

      if (transactionId) {
        await api.put(`/v1/transactions/${transactionId}`, payload);
        message.success("Transaction updated successfully");
      } else {
        await api.post("/v1/transactions", payload);
        message.success("Transaction created successfully");
      }

      onSuccess();
      onClose();
    } catch (err) {
      message.error(
        err.response?.data?.message || "Failed to save transaction",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      title={transactionId ? "Edit Transaction" : "Add Transaction"}
      width={460}
      open={open}
      onClose={onClose}
      loading={loading}
      destroyOnClose
      footer={
        <div
          style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}
        >
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            onClick={() => form.submit()}
            loading={submitting}
          >
            Save
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label="Date"
          name="transaction_date"
          rules={[
            { required: true, message: "Please select a transaction date" },
          ]}
        >
          <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
        </Form.Item>

        <Form.Item label="Type" required>
          <Radio.Group
            value={cashflowType}
            onChange={(e) => {
              const val = e.target.value;
              setCashflowType(val);
              form.setFieldsValue({ category_id: undefined });
            }}
            optionType="button"
            buttonStyle="solid"
            style={{ width: "100%" }}
          >
            <Radio.Button
              value="income"
              style={{ width: "50%", textAlign: "center" }}
            >
              Income
            </Radio.Button>
            <Radio.Button
              value="expense"
              style={{ width: "50%", textAlign: "center" }}
            >
              Expense
            </Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          label="Category"
          name="category_id"
          rules={[{ required: true, message: "Please select a category" }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="Select category"
            open={selectCategoryOpen}
            onDropdownVisibleChange={setSelectCategoryOpen}
            onChange={() => setSelectCategoryOpen(false)}
            getPopupContainer={(triggerNode) => triggerNode.parentNode}
            options={categories
              .filter((c) => c.base_type === cashflowType)
              .map((c) => ({
                label: c.name,
                value: c.id,
              }))}
          />
        </Form.Item>

        <Form.Item
          label="Amount"
          name="amount"
          rules={[
            { required: true, message: "Please input amount" },
            {
              validator: (_, value) => {
                if (
                  value !== undefined &&
                  value !== null &&
                  value !== "" &&
                  Number(value) <= 0
                ) {
                  return Promise.reject(
                    new Error("Amount must be greater than 0"),
                  );
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <InputNumeric useCurrency placeholder="0" />
        </Form.Item>

        <Form.Item label="Link to Account">
          <Radio.Group
            value={linkType}
            onChange={handleLinkTypeChange}
            optionType="button"
            buttonStyle="solid"
            style={{ width: "100%" }}
          >
            <Radio.Button
              value="none"
              style={{ width: "33.33%", textAlign: "center" }}
            >
              None
            </Radio.Button>
            <Radio.Button
              value="asset"
              style={{ width: "33.33%", textAlign: "center" }}
            >
              Asset
            </Radio.Button>
            <Radio.Button
              value="liability"
              style={{ width: "33.34%", textAlign: "center" }}
            >
              Liability
            </Radio.Button>
          </Radio.Group>
        </Form.Item>

        {linkType === "asset" && (
          <>
            <Form.Item
              label="Linked Asset"
              name="asset_id"
              rules={[{ required: true, message: "Please select an asset" }]}
              style={{ marginBottom: 12 }}
            >
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Select active asset"
                open={selectAssetOpen}
                onDropdownVisibleChange={setSelectAssetOpen}
                onChange={() => setSelectAssetOpen(false)}
                getPopupContainer={(triggerNode) => triggerNode.parentNode}
                notFoundContent={
                  assets.length === 0 ? "No active assets found" : undefined
                }
                options={assets.map((a) => {
                  const valStr = formatRupiah(a.current_value);
                  const cat =
                    a.category || a.category_name || a.category_type || "";
                  return {
                    label: `${a.name}${cat ? ` (${cat})` : ""} — ${valStr}`,
                    value: a.id,
                  };
                })}
              />
            </Form.Item>

            <Form.Item
              name="update_balance"
              valuePropName="checked"
              initialValue={true}
              style={{ marginBottom: selectedAsset ? 10 : 20 }}
            >
              <Checkbox>
                <span style={{ fontSize: 13, color: "#E6EDF3" }}>
                  Automatically update asset balance
                </span>
              </Checkbox>
            </Form.Item>

            {selectedAsset && (
              <div
                style={{
                  background: "#0D1117",
                  border: "1px solid #21262D",
                  borderRadius: 8,
                  padding: "10px 14px",
                  marginBottom: 20,
                  fontSize: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#8B949E",
                    marginBottom: 4,
                  }}
                >
                  <span>Current Balance ({selectedAsset.name}):</span>
                  <span style={{ fontWeight: 600, color: "#F0F6FC" }}>
                    {formatRupiah(selectedAsset.current_value)}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: 11,
                    color: isExpense ? "#10B981" : "#38BDF8",
                    background: isExpense
                      ? "rgba(16, 185, 129, 0.08)"
                      : "rgba(56, 189, 248, 0.08)",
                    border: `1px solid ${
                      isExpense
                        ? "rgba(16, 185, 129, 0.2)"
                        : "rgba(56, 189, 248, 0.2)"
                    }`,
                    borderRadius: 6,
                    padding: "4px 8px",
                    marginTop: 6,
                    marginBottom: 6,
                  }}
                >
                  {isExpense
                    ? "💡 Capital purchase: Asset balance increases"
                    : "💡 Asset liquidation / sale: Asset balance decreases"}
                </div>

                {shouldUpdateBalance !== false ? (
                  <>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: 6,
                        paddingTop: 6,
                        borderTop: "1px dashed #21262D",
                      }}
                    >
                      <span style={{ color: "#8B949E" }}>Estimated New Balance:</span>
                      <div style={{ textAlign: "right" }}>
                        <span
                          style={{
                            fontWeight: 700,
                            color:
                              diffAssetBalance > 0
                                ? "#10B981"
                                : diffAssetBalance < 0
                                ? "#EF4444"
                                : "#F0F6FC",
                            marginRight: 6,
                          }}
                        >
                          {formatRupiah(estimatedNewBalance)}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            color:
                              diffAssetBalance > 0
                                ? "#10B981"
                                : diffAssetBalance < 0
                                ? "#EF4444"
                                : "#8B949E",
                          }}
                        >
                          {diffAssetBalance === 0
                            ? "(No change)"
                            : `(${diffAssetBalance > 0 ? "+" : "-"}${formatRupiah(
                                Math.abs(diffAssetBalance),
                              )})`}
                        </span>
                      </div>
                    </div>

                    {!isExpense && estimatedNewBalance < 0 && (
                      <div
                        style={{
                          marginTop: 6,
                          color: "#F87171",
                          fontSize: 11,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        ⚠️ Warning: Sale amount exceeds current asset balance.
                      </div>
                    )}
                  </>
                ) : (
                  <div
                    style={{
                      marginTop: 6,
                      paddingTop: 6,
                      borderTop: "1px dashed #21262D",
                      color: wasBalanceUpdatedForThisAsset ? "#F59E0B" : "#8B949E",
                      fontStyle: wasBalanceUpdatedForThisAsset ? "normal" : "italic",
                      fontSize: 11,
                    }}
                  >
                    {wasBalanceUpdatedForThisAsset ? (
                      <>
                        ⚠️ Unchecking this will revert the previous transaction effect (balance will return to{" "}
                        <strong style={{ color: "#F0F6FC" }}>
                          {formatRupiah(baseAssetVal)}
                        </strong>
                        ).
                      </>
                    ) : (
                      "Asset balance will not be modified (linked as reference only)."
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {linkType === "liability" && (
          <>
            <Form.Item
              label="Linked Liability"
              name="liability_id"
              rules={[{ required: true, message: "Please select a liability" }]}
              style={{ marginBottom: 12 }}
            >
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Select active liability"
                open={selectLiabilityOpen}
                onDropdownVisibleChange={setSelectLiabilityOpen}
                onChange={() => setSelectLiabilityOpen(false)}
                getPopupContainer={(triggerNode) => triggerNode.parentNode}
                notFoundContent={
                  liabilities.length === 0
                    ? "No active liabilities found"
                    : undefined
                }
                options={liabilities.map((l) => {
                  const bal = formatRupiah(
                    l.remaining_balance ?? l.principal_amount ?? 0,
                  );
                  const cat =
                    l.category || l.category_name || l.category_type || "";
                  return {
                    label: `${l.name}${cat ? ` (${cat})` : ""} — Remaining: ${bal}`,
                    value: l.id,
                  };
                })}
              />
            </Form.Item>

            <Form.Item
              name="update_balance"
              valuePropName="checked"
              initialValue={true}
              style={{ marginBottom: selectedLiability ? 10 : 20 }}
            >
              <Checkbox>
                <span style={{ fontSize: 13, color: "#E6EDF3" }}>
                  Automatically update liability balance
                </span>
              </Checkbox>
            </Form.Item>

            {selectedLiability && (
              <div
                style={{
                  background: "#0D1117",
                  border: "1px solid #21262D",
                  borderRadius: 8,
                  padding: "10px 14px",
                  marginBottom: 20,
                  fontSize: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#8B949E",
                    marginBottom: 4,
                  }}
                >
                  <span>Current Remaining ({selectedLiability.name}):</span>
                  <span style={{ fontWeight: 600, color: "#F0F6FC" }}>
                    {formatRupiah(liabRemainingVal)}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: 11,
                    color: isExpense ? "#10B981" : "#F59E0B",
                    background: isExpense
                      ? "rgba(16, 185, 129, 0.08)"
                      : "rgba(245, 158, 11, 0.08)",
                    border: `1px solid ${
                      isExpense
                        ? "rgba(16, 185, 129, 0.2)"
                        : "rgba(245, 158, 11, 0.2)"
                    }`,
                    borderRadius: 6,
                    padding: "4px 8px",
                    marginTop: 6,
                    marginBottom: 6,
                  }}
                >
                  {isExpense
                    ? "💡 Debt repayment: Remaining balance decreases"
                    : "💡 Loan disbursement / new debt: Remaining balance increases"}
                </div>

                {shouldUpdateBalance !== false ? (
                  <>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: 6,
                        paddingTop: 6,
                        borderTop: "1px dashed #21262D",
                      }}
                    >
                      <span style={{ color: "#8B949E" }}>Estimated Remaining:</span>
                      <div style={{ textAlign: "right" }}>
                        <span
                          style={{
                            fontWeight: 700,
                            color:
                              diffLiabilityBalance < 0
                                ? "#10B981"
                                : diffLiabilityBalance > 0
                                ? "#F59E0B"
                                : "#F0F6FC",
                            marginRight: 6,
                          }}
                        >
                          {formatRupiah(Math.max(0, estimatedNewLiabilityBalance))}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            color:
                              diffLiabilityBalance < 0
                                ? "#10B981"
                                : diffLiabilityBalance > 0
                                ? "#F59E0B"
                                : "#8B949E",
                          }}
                        >
                          {diffLiabilityBalance === 0
                            ? "(No change)"
                            : `(${diffLiabilityBalance > 0 ? "+" : "-"}${formatRupiah(
                                Math.abs(diffLiabilityBalance),
                              )})`}
                        </span>
                      </div>
                    </div>

                    {isExpense && estimatedNewLiabilityBalance < 0 && (
                      <div
                        style={{
                          marginTop: 6,
                          color: "#F87171",
                          fontSize: 11,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        ⚠️ Warning: Payment exceeds current remaining liability balance.
                      </div>
                    )}

                    {isExpense && estimatedNewLiabilityBalance === 0 && (
                      <div
                        style={{
                          marginTop: 6,
                          color: "#10B981",
                          fontSize: 11,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        🎉 Liability will be fully paid off!
                      </div>
                    )}
                  </>
                ) : (
                  <div
                    style={{
                      marginTop: 6,
                      paddingTop: 6,
                      borderTop: "1px dashed #21262D",
                      color: wasBalanceUpdatedForThisLiability ? "#F59E0B" : "#8B949E",
                      fontStyle: wasBalanceUpdatedForThisLiability ? "normal" : "italic",
                      fontSize: 11,
                    }}
                  >
                    {wasBalanceUpdatedForThisLiability ? (
                      <>
                        ⚠️ Unchecking this will revert the previous transaction effect (remaining debt will return to{" "}
                        <strong style={{ color: "#F0F6FC" }}>
                          {formatRupiah(baseLiabVal)}
                        </strong>
                        ).
                      </>
                    ) : (
                      "Liability balance will not be modified (linked as reference only)."
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <Form.Item label="Notes" name="notes">
          <Input.TextArea placeholder="Enter notes..." rows={3} />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
