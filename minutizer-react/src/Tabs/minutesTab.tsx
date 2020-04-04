import React, { useEffect } from "react";
import clsx from "clsx";
import {
  createStyles,
  lighten,
  makeStyles,
  Theme
} from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TablePagination from "@material-ui/core/TablePagination";
import TableRow from "@material-ui/core/TableRow";
import TableSortLabel from "@material-ui/core/TableSortLabel";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import Checkbox from "@material-ui/core/Checkbox";
import IconButton from "@material-ui/core/IconButton";
import MailOutlineIcon from "@material-ui/icons/Email";
import CheckIcon from "@material-ui/icons/Check";
import CircularProgress from "@material-ui/core/CircularProgress";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import Alert from "@material-ui/lab/Alert";

import { connect } from "react-redux";

const postURL = `https://us-central1-hacksbc-268409.cloudfunctions.net/meeting-minutes-email`;

export interface Data {
  meetingId: string;
  meetingName: string;
  meetingDate: string;
  organizerUserName: string;
}

function createData(
  meetingId: string,
  meetingName: string,
  meetingDate: string,
  organizerUserName: string
): Data {
  return { meetingId, meetingName, meetingDate, organizerUserName };
}

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

type Order = "asc" | "desc";

function getComparator<Key extends keyof any>(
  order: Order,
  orderBy: Key
): (
  a: { [key in Key]: number | string },
  b: { [key in Key]: number | string }
) => number {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort<T>(array: T[], comparator: (a: T, b: T) => number) {
  const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map(el => el[0]);
}

interface HeadCell {
  disablePadding: boolean;
  id: keyof Data;
  label: string;
  numeric: boolean;
}

const headCells: HeadCell[] = [
  {
    id: "meetingId",
    numeric: false,
    disablePadding: true,
    label: "Meeting ID"
  },
  {
    id: "meetingName",
    numeric: true,
    disablePadding: false,
    label: "Meeting Name"
  },
  {
    id: "meetingDate",
    numeric: true,
    disablePadding: false,
    label: "Meeting Date"
  },
  {
    id: "organizerUserName",
    numeric: true,
    disablePadding: false,
    label: "Organizer"
  }
];

interface EnhancedTableProps {
  classes: ReturnType<typeof useStyles>;
  numSelected: number;
  onRequestSort: (
    event: React.MouseEvent<unknown>,
    property: keyof Data
  ) => void;
  onSelectAllClick: (
    event: React.ChangeEvent<HTMLInputElement>,
    checked: boolean
  ) => void;
  order: Order;
  orderBy: string;
  rowCount: number;
  completed: boolean;
}

function EnhancedTableHead(props: EnhancedTableProps) {
  const {
    classes,
    onSelectAllClick,
    order,
    orderBy,
    numSelected,
    rowCount,
    onRequestSort,
    completed
  } = props;
  const createSortHandler = (property: keyof Data) => (
    event: React.MouseEvent<unknown>
  ) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        {completed ? (
          <TableCell padding="checkbox">
            <Checkbox
              indeterminate={numSelected > 0 && numSelected < rowCount}
              checked={rowCount > 0 && numSelected === rowCount}
              onChange={onSelectAllClick}
              inputProps={{ "aria-label": "select all" }}
            />
          </TableCell>
        ) : (
          <TableCell></TableCell>
        )}
        {headCells.map(headCell => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? "right" : "left"}
            padding={headCell.disablePadding ? "none" : "default"}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : "asc"}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <span className={classes.visuallyHidden}>
                  {order === "desc" ? "sorted descending" : "sorted ascending"}
                </span>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

const useToolbarStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(1)
    },
    highlight:
      theme.palette.type === "light"
        ? {
            color: theme.palette.secondary.main,
            backgroundColor: lighten(theme.palette.secondary.light, 0.85)
          }
        : {
            color: theme.palette.text.primary,
            backgroundColor: theme.palette.secondary.dark
          },
    title: {
      flex: "1 1 100%"
    }
  })
);

interface EnhancedTableToolbarProps {
  meetingIdsSelected: String[];
  meetingNamesSelected: String[];
  completed: boolean;
}

const EnhancedTableToolbar = (props: EnhancedTableToolbarProps) => {
  const classes = useToolbarStyles();
  const { meetingIdsSelected, meetingNamesSelected, completed } = props;
  const numSelected = meetingIdsSelected.length;
  let popUpTitle = "Sending " + numSelected + " minute(s)";
  let dialogText = "";
  let successfulRes = 0;
  const requestButtonHandler = () => {
    if (numSelected) {
      handleClickOpen();
      // send requests to all selected meetings
      for (let i = 0; i < meetingIdsSelected.length; i++) {
        fetch(postURL, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            meetingId: meetingIdsSelected[i],
            meetingName: meetingNamesSelected[i]
          })
        })
          .then(res => handleResponse(res))
          .catch(err => handleError(err));
      }
    }
  };

  const handleResponse = res => {
    successfulRes++;
    if (successfulRes === numSelected) {
      showSuccessDialog();
    }
  };

  const handleError = err => {
    handleClose();
    setOpenErrorAlert(true);
  };

  const showSuccessDialog = () => {
    handleClose();
    setOpenSuccessAlert(true);
  };

  const [open, setOpen] = React.useState(false);
  const [openSuccessAlert, setOpenSuccessAlert] = React.useState(false);
  const [openErrorAlert, setOpenErrorAlert] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleCloseErrorAlert = () => {
    setOpenErrorAlert(false);
  };

  const handleCloseSuccessAlert = () => {
    setOpenSuccessAlert(false);
    successfulRes = 0;
  };

  return (
    <div>
      {completed ? (
        <Toolbar
          className={clsx(classes.root, {
            [classes.highlight]: numSelected > 0
          })}
        >
          {numSelected > 0 ? (
            <Typography
              className={classes.title}
              color="inherit"
              variant="subtitle1"
            >
              {numSelected} selected
            </Typography>
          ) : (
            <Typography className={classes.title} variant="h6" id="tableTitle">
              Meeting Minutes
            </Typography>
          )}
          <div onClick={event => requestButtonHandler()}>
            <IconButton aria-label="disabled" disabled={numSelected <= 0}>
              <MailOutlineIcon style={{ fontSize: 35 }} />
            </IconButton>
          </div>
          <Dialog
            open={open}
            onClose={handleClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
          >
            <DialogTitle id="alert-dialog-title">{popUpTitle}</DialogTitle>
            <DialogContent>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <CircularProgress />
              </div>
              <DialogContentText id="alert-dialog-description">
                {dialogText}
              </DialogContentText>
            </DialogContent>
          </Dialog>

          <Dialog
            open={openSuccessAlert}
            onClose={handleCloseSuccessAlert}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
          >
            <DialogContent>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <Alert
                  icon={<CheckIcon fontSize="inherit" />}
                  severity="success"
                >
                  Success
                </Alert>
              </div>
              <DialogContentText id="alert-dialog-description">
                {dialogText}
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseSuccessAlert} color="primary">
                OK
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={openErrorAlert}
            onClose={handleCloseErrorAlert}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
          >
            <DialogContent>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <Alert severity="error">An error has occured</Alert>
              </div>
              <DialogContentText id="alert-dialog-description">
                {dialogText}
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseErrorAlert} color="primary">
                OK
              </Button>
            </DialogActions>
          </Dialog>
        </Toolbar>
      ) : (
        <Toolbar>
          <Typography className={classes.title} variant="h6" id="tableTitle">
            In-Progress Transcriptions
          </Typography>
        </Toolbar>
      )}
    </div>
  );
};

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: "100%"
    },
    paper: {
      width: "100%",
      marginBottom: theme.spacing(2)
    },
    table: {
      minWidth: 950
      //maxWidth:1500,
    },
    visuallyHidden: {
      border: 0,
      clip: "rect(0 0 0 0)",
      height: 1,
      margin: -1,
      overflow: "hidden",
      padding: 0,
      position: "absolute",
      top: 20,
      width: 1
    }
  })
);

function MyTable(url: { from: string; completed: boolean; currentUser: any }) {
  const classes = useStyles();
  const [order, setOrder] = React.useState<Order>("desc");
  const [orderBy, setOrderBy] = React.useState<keyof Data>("meetingId");
  const [selected, setSelected] = React.useState<string[]>([]);
  const [selectedMeetingNames, setSelectedMeetingNames] = React.useState<
    string[]
  >([]);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [meetings, setMeetings] = React.useState<Data[]>([]);
  const [count, setCount] = React.useState(0);
  const [loading, setLoading] = React.useState<Boolean>(true);

  useEffect(() => {
    fetchMeetings().then(res => setMeetings(meetings.concat(res)));
    setLoading(false);
  }, [loading]);

  const fetchMeetings = async () => {
    const requestUrl = url.from + `&page=${page}`;
    console.log(url.currentUser);
    const getUserIdToken = async () => {
      if (url.currentUser) {
        try {
          const token = await url.currentUser.getIdToken(false);
          return token;
        } catch (e) {
          console.log(e);
        }
      }
    };
    const authorizationHeaderValue: string =
      "Bearer " + (await getUserIdToken());
    const header: Headers = new Headers();
    header.append("Authorization", authorizationHeaderValue);
    let res = await fetch(requestUrl, {
      method: "GET",
      headers: header
    });
    let buf = await res.json();

    setCount(buf.total);
    let data: Data[] = Object.values(buf.data);
    data = data.map(el =>
      createData(
        el.meetingId,
        el.meetingName,
        el.meetingDate,
        el.organizerUserName
      )
    );
    // maybe add some error checking

    return data;
  };

  const handleRequestSort = (
    event: React.MouseEvent<unknown>,
    property: keyof Data
  ) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelectedIds = meetings.map(n => n.meetingId);
      const newSelectedNames = meetings.map(n => n.meetingName);
      setSelected(newSelectedIds);
      setSelectedMeetingNames(newSelectedNames);
      return;
    }
    setSelected([]);
    setSelectedMeetingNames([]);
  };

  const handleClick = (
    event: React.MouseEvent<unknown>,
    id: string,
    name: string
  ) => {
    const selectedIndex = selected.indexOf(id);

    let newSelected: string[] = [];
    let newNameSelected: string[] = [];

    if (selectedIndex === -1) {
      // if the selected row is not selected already
      newSelected = newSelected.concat(selected, id);
      newNameSelected = newNameSelected.concat(selectedMeetingNames, name);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
      newNameSelected = newNameSelected.concat(selectedMeetingNames.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
      newNameSelected = newNameSelected.concat(
        selectedMeetingNames.slice(0, -1)
      );
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
      newNameSelected = newNameSelected.concat(
        selectedMeetingNames.slice(0, selectedIndex),
        selectedMeetingNames.slice(selectedIndex + 1)
      );
    }
    setSelected(newSelected);
    setSelectedMeetingNames(newNameSelected);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    if (meetings.length / 10 < newPage + 1) {
      // if have not loaded the meetings on this page
      setLoading(true);
    }
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const isSelected = (name: any) => selected.indexOf(name) !== -1;

  const emptyRows =
    rowsPerPage - Math.min(rowsPerPage, meetings.length - page * rowsPerPage);

  return (
    <div
      style={{
        margin: "0px 0px",
        borderRadius: "25px",
        backgroundColor: "e62020"
      }}
      className="p-5 shadow-lg "
    >
      <div className={classes.root}>
        <Paper className={classes.paper}>
          <EnhancedTableToolbar
            meetingIdsSelected={selected}
            meetingNamesSelected={selectedMeetingNames}
            completed={url.completed}
          />
          <TableContainer>
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center" }}>
                <CircularProgress />
              </div>
            ) : (
              <Table
                className={classes.table}
                aria-labelledby="tableTitle"
                aria-label="enhanced table"
              >
                <EnhancedTableHead
                  classes={classes}
                  numSelected={selected.length}
                  order={order}
                  orderBy={orderBy}
                  onSelectAllClick={handleSelectAllClick}
                  onRequestSort={handleRequestSort}
                  rowCount={meetings.length}
                  completed={url.completed}
                />
                <TableBody>
                  {stableSort(meetings, getComparator(order, orderBy))
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((meeting, index) => {
                      const isItemSelected = isSelected(meeting.meetingId);
                      const labelId = `enhanced-table-checkbox-${index}`;

                      return (
                        <TableRow
                          hover
                          onClick={event =>
                            handleClick(
                              event,
                              meeting.meetingId,
                              meeting.meetingName
                            )
                          }
                          role="checkbox"
                          aria-checked={isItemSelected}
                          tabIndex={-1}
                          key={meeting.meetingId}
                          selected={isItemSelected}
                        >
                          {url.completed ? (
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={isItemSelected}
                                inputProps={{ "aria-labelledby": labelId }}
                              />
                            </TableCell>
                          ) : (
                            <TableCell></TableCell>
                          )}
                          <TableCell
                            component="th"
                            id={labelId}
                            scope="row"
                            padding="none"
                          >
                            {meeting.meetingId}
                          </TableCell>
                          <TableCell align="right">
                            {meeting.meetingName}
                          </TableCell>
                          <TableCell align="right">
                            {meeting.meetingDate}
                          </TableCell>
                          <TableCell align="right">
                            {meeting.organizerUserName}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  {emptyRows > 0 && (
                    <TableRow style={{ height: 33 * emptyRows }}>
                      <TableCell colSpan={6} />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10]}
            component="div"
            count={count}
            rowsPerPage={rowsPerPage}
            page={page}
            onChangePage={handleChangePage}
            onChangeRowsPerPage={handleChangeRowsPerPage}
          />
        </Paper>
      </div>
    </div>
  );
}
const mapStateToProps = ({ user }) => ({
  currentUser: user.currentUser
});
export default connect(mapStateToProps)(MyTable);
