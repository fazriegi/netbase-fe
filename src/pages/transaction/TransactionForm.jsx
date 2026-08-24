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
  App,
} from "antd";
import InputNumeric from "src/components/input/InputNumeric";
import api from "src/pkg/api";
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

  const [categories, setCategories] = useState([]);
  const [assets, setAssets] = useState([]);
  const [liabilities, setLiabilities] = useState([]);

  const [selectCategoryOpen, setSelectCategoryOpen] = useState(false);
  const [selectAssetOpen, setSelectAssetOpen] = useState(false);
  const [selectLiabilityOpen, setSelectLiabilityOpen] = useState(false);

  const [cashflowType, setCashflowType] = useState("income"); // "income" | "expense"
  const [linkType, setLinkType] = useState("none"); // "none" | "asset" | "liability"

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
      fetchDropdowns();

      if (transactionId) {
        fetchTransaction();
      } else {
        form.setFieldsValue({
          transaction_date: dayjs(),
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
        });
      }
    } catch {
      message.error("Failed to fetch transaction details");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (val) => {
    const selectedCat = categories.find((c) => c.id === val);
    if (!selectedCat) return;

    setLinkType("none");
    form.setFieldsValue({ asset_id: undefined, liability_id: undefined });
  };

  const handleLinkTypeChange = (e) => {
    const val = e.target.value;
    setLinkType(val);
    if (val === "none") {
      form.setFieldsValue({ asset_id: undefined, liability_id: undefined });
    } else if (val === "asset") {
      form.setFieldsValue({ liability_id: undefined });
    } else if (val === "liability") {
      form.setFieldsValue({ asset_id: undefined });
    }
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        category_id: values.category_id,
        amount: values.amount,
        transaction_date: values.transaction_date.format("YYYY-MM-DD"),
        notes: values.notes || null,
        asset_id: linkType === "asset" ? values.asset_id : null,
        liability_id: linkType === "liability" ? values.liability_id : null,
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
            placeholder="Select category"
            open={selectCategoryOpen}
            onDropdownVisibleChange={setSelectCategoryOpen}
            onChange={(val) => {
              handleCategoryChange(val);
              setSelectCategoryOpen(false);
            }}
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
          rules={[{ required: true, message: "Please input amount" }]}
        >
          <InputNumeric />
        </Form.Item>

        <Form.Item label="Link to Account">
          <Radio.Group value={linkType} onChange={handleLinkTypeChange}>
            <Radio value="none">None</Radio>
            <Radio value="asset">Asset</Radio>
            <Radio value="liability">Liability</Radio>
          </Radio.Group>
        </Form.Item>

        {linkType === "asset" && (
          <Form.Item
            label="Linked Asset"
            name="asset_id"
            rules={[{ required: true, message: "Please select an asset" }]}
          >
            <Select
              placeholder="Select active asset"
              open={selectAssetOpen}
              onDropdownVisibleChange={setSelectAssetOpen}
              onChange={() => setSelectAssetOpen(false)}
              getPopupContainer={(triggerNode) => triggerNode.parentNode}
              options={assets.map((a) => ({
                label: `${a.name} (${a.category})`,
                value: a.id,
              }))}
            />
          </Form.Item>
        )}

        {linkType === "liability" && (
          <Form.Item
            label="Linked Liability"
            name="liability_id"
            rules={[{ required: true, message: "Please select a liability" }]}
          >
            <Select
              placeholder="Select active liability"
              open={selectLiabilityOpen}
              onDropdownVisibleChange={setSelectLiabilityOpen}
              onChange={() => setSelectLiabilityOpen(false)}
              getPopupContainer={(triggerNode) => triggerNode.parentNode}
              options={liabilities.map((l) => ({
                label: `${l.name} (${l.category})`,
                value: l.id,
              }))}
            />
          </Form.Item>
        )}

        <Form.Item label="Notes" name="notes">
          <Input.TextArea placeholder="Enter notes..." rows={3} />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
